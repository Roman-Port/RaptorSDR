import IRaptorConnection from "../sdk/IRaptorConnection";
import IRaptorConfigurable from "../sdk/misc/IRaptorConfigurable";
import IRaptorWindow from "../sdk/ui/core/IRaptorWindow";
import IRaptorWindowContext from "../sdk/ui/core/IRaptorWindowContext";
import { RaptorSettingsTab } from "../sdk/ui/setting/RaptorSettingsTab";
import IRaptorPrimitiveDataProvider from "../sdk/web/providers/IRaptorPrimitiveDataProvider";
import BasePart from "./parts/BasePart";
import ISpectrumPersistSettings from "./misc/ISpectrumPersistSettings";
import SpectrumPart from "./parts/SpectrumPart";
import WaterfallPart from "./parts/WaterfallPart";
import ISpectrumInfo from "./config/SpectrumInfo";
import SpectrumStream from "./web/SpectrumStream";
import ISpectrumFrame from "./web/ISpectrumFrame";
import { SpectrumOpcode } from "./web/SpectrumOpcode";
import SpectrumZoomPreview from "./misc/SpectrumZoomPreview";
import SpectrumDataProvider from "./misc/SpectrumDataProvider";
import ISpectrumDataProviderHost from "./misc/ISpectrumDataProviderHost";
import SpectrumDataProviderScaler from "./misc/SpectrumDataProviderScaler";
import RaptorEventDispaptcher from "../sdk/RaptorEventDispatcher";
import RaptorUiUtil from "../sdk/util/RaptorUiUtil";

require("./style.css");

export default class SpectrumWindow implements IRaptorWindow, ISpectrumDataProviderHost {

    constructor(ctx: IRaptorWindowContext) {
        this.ctx = ctx;
        this.conn = ctx.conn;
        this.info = ctx.info as ISpectrumInfo;
        this.persist = ctx.persist as ISpectrumPersistSettings;

        //Create stream
        this.sock = new SpectrumStream(this.conn, this.info, true);

        //Create data providers
        this.SettingOffset = new SpectrumDataProvider(this, "offset", "offset", this.info.defaultOffset);
        this.SettingRange = new SpectrumDataProvider(this, "range", "range", this.info.defaultRange);
        this.SettingAttack = new SpectrumDataProvider(this, "attack", "attack", this.info.defaultAttack);
        this.SettingDecay = new SpectrumDataProvider(this, "decay", "decay", this.info.defaultDecay);
        this.SettingZoom = new SpectrumDataProvider(this, "zoom", "zoom", 0.5);
        this.SettingCenter = new SpectrumDataProvider(this, "center", "center", 0.5);

        //Create "fake" data providers for the sample rate
        this.SampleRate = {
            GetValue: () => {
                return this.sampleRate;
            },
            SetValue: () => {
                throw new Error("Cannot set sample rate.");
            },
            OnChanged: new RaptorEventDispaptcher<number>()
        }
        this.SampleRateZoomed = {
            GetValue: () => {
                return this.sampleRate * this.SettingZoom.GetValue();
            },
            SetValue: () => {
                throw new Error("Cannot set sample rate.");
            },
            OnChanged: new RaptorEventDispaptcher<number>()
        }

        //Create zoom preview
        this.preview = new SpectrumZoomPreview(this.SettingZoom, this.SettingCenter);

        //Create settings panel
        var settings = ctx.CreateSettingsRegion(this.info.name + " Settings", "settings")
            .AddOptionRange("Offset", this.SettingOffset, 0, 200)
            .AddOptionRange("Range", this.SettingRange, 1, 200)
            .AddOptionRange("Attack", new SpectrumDataProviderScaler(this.SettingAttack, 100), 0, 100)
            .AddOptionRange("Decay", new SpectrumDataProviderScaler(this.SettingDecay, 100), 0, 100)
            .Build();
        ctx.RegisterSettingsRegionSidebar(settings, RaptorSettingsTab.GENRAL);
    }

    conn: IRaptorConnection;
    ctx: IRaptorWindowContext;
    info: ISpectrumInfo;
    persist: ISpectrumPersistSettings;
    sock: SpectrumStream;

    SettingOffset: IRaptorConfigurable<number>;
    SettingRange: IRaptorConfigurable<number>;
    SettingAttack: IRaptorConfigurable<number>;
    SettingDecay: IRaptorConfigurable<number>;
    SettingZoom: IRaptorConfigurable<number>;
    SettingCenter: IRaptorConfigurable<number>;
    SampleRate: IRaptorConfigurable<number>;
    SampleRateZoomed: IRaptorConfigurable<number>;

    private parts: BasePart[] = [];
    private spectrumHeight: number; //only applies to hybrid mode
    private window: HTMLElement;
    private slider: HTMLElement;
    private sliderDragging: boolean;
    private persistentSpectrumHeightUpdated: boolean = false;
    private freqDataProvider: IRaptorPrimitiveDataProvider<number>;
    private sampleRate: number = 1;
    private preview: SpectrumZoomPreview;

    static readonly PADDING_LEFT: number = 25;
    static readonly PADDING_RIGHT: number = 15;
    static readonly PADDING_WIDTH: number = SpectrumWindow.PADDING_LEFT + SpectrumWindow.PADDING_RIGHT;

    GetWindowName(): string {
        return this.info.name;
    }

    CreateWindow(win: HTMLElement): void {
        //Configure
        this.window = win;
        this.window.classList.add("rplug_spectrum");

        //Get the data provider for the frequency (if any)
        if (this.info.freqDataProvider != null) {
            this.freqDataProvider = this.conn.GetPrimitiveDataProvider<number>(this.info.freqDataProvider);
            this.freqDataProvider.OnChanged.Bind(() => {
                this.SettingsChanged();
            });
        }

        //Create parts
        this.parts = [
            new SpectrumPart(this.CreateContainer(win), this.info, this.SampleRateZoomed),
            new WaterfallPart(this.CreateContainer(win))
        ];

        //Bind draw
        this.sock.FrameReceived.Bind((frame: ISpectrumFrame) => {
            //Check if the sample rate was updated
            if (this.sampleRate != frame.sampleRate) {
                this.sampleRate = frame.sampleRate;
                this.SampleRate.OnChanged.Fire(this.SampleRate.GetValue());
                this.SampleRateZoomed.OnChanged.Fire(this.SampleRateZoomed.GetValue());
                this.SettingsChanged();
            }

            //Send from opcode
            if (frame.opcode == SpectrumOpcode.OP_FRAME_ZOOM && this.sock.IsTokenCurrent(frame.token)) {
                for (var i = 0; i < this.parts.length; i++) {
                    this.parts[i].ProcessFrame(frame.frame);
                }
            }
            if (frame.opcode == SpectrumOpcode.OP_FRAME_FULL && this.sock.IsTokenCurrent(frame.token)) {
                this.preview.AddFrame(frame.frame);
            }
        });

        //Mount zoom preview
        this.preview.MountTo(win);

        //Bind zoom event
        win.addEventListener("wheel", (evt: WheelEvent) => {
            var value = this.SettingZoom.GetValue() + (0.03 * Math.max(-1, Math.min(1, evt.deltaY)));
            this.SettingZoom.SetValue(Math.max(0, Math.min(1, value)));
            var halfZoom = this.SettingZoom.GetValue() / 2;
            this.SettingCenter.SetValue(Math.max(halfZoom, Math.min(1 - halfZoom, this.SettingCenter.GetValue())));
            evt.preventDefault();
            evt.stopPropagation();
        });

        //Create the slider
        this.slider = RaptorUiUtil.CreateDom("div", "rplug_spectrum_handle", win);
        RaptorUiUtil.CreateDom("div", null, this.slider);
        RaptorUiUtil.CreateDom("div", null, this.slider);
        this.slider.addEventListener("mousedown", () => this.sliderDragging = true);
        window.addEventListener("mouseup", () => this.sliderDragging = false);
        window.addEventListener("mousemove", (evt: MouseEvent) => {
            if (this.sliderDragging) {
                this.spectrumHeight += evt.movementY;
                this.ConfigureLayout();
                evt.preventDefault();
                evt.stopPropagation();
            }
        });
    }

    DestoryWindow(): void {
        
    }

    ResizeWindow(width: number, height: number) {
        //If height is 0, abort
        if (height == 0) { return; }

        //Now that we know the height, apply persistent settings
        if (!this.persistentSpectrumHeightUpdated) {
            this.spectrumHeight = height * (this.persist.spectrumHeightPercent == null ? 0.5 : this.persist.spectrumHeightPercent);
            this.persistentSpectrumHeightUpdated = true;
        }

        //Configure
        this.ConfigureLayout();

        //Send resize command to server
        this.sock.SetSize(width - SpectrumWindow.PADDING_WIDTH);
    }

    SettingsChanged() {
        //Get the frequency from the data provider
        var freq = this.freqDataProvider == null ? 0 : this.freqDataProvider.GetValue();

        //Offset it by the zoom
        freq += (this.SettingCenter.GetValue() - 0.5) * (this.sampleRate * 1);

        //If this is a real spectrum, fix the scaling so that the center is actually sampleRate/2
        if (!this.info.useCenterFreq)
            freq += this.sampleRate / 2;

        //Dispatch to parts
        for (var i = 0; i < this.parts.length; i++)
            this.parts[i].SettingsChanged(
                freq,
                this.sampleRate,
                this.persist.offset,
                this.persist.range
            );

        //Update preview
        if (this.preview != null)
            this.preview.UpdateRegion();
    }

    private ConfigureLayout() {
        //Get total width and height
        var height = this.window.clientHeight;
        var width = this.window.clientWidth;

        //Constrain height
        this.spectrumHeight = Math.max(0, Math.min(this.window.clientHeight, this.spectrumHeight));

        //Configure depending on mode
        if (this.spectrumHeight < 30) {
            //Make the waterfall fullscreen, disable spectrum
            this.parts[1].Update(width, height, this.persist.offset, this.persist.range);
            this.parts[1].SetEnabled(true);
            this.parts[1].SetOffset(0);
            this.parts[0].SetEnabled(false);
            this.parts[0].Update(width, 0, this.persist.offset, this.persist.range);

            //Move slider to top
            this.slider.style.top = (0 - 15) + "px";
        } else if ((this.window.clientHeight - this.spectrumHeight) < 30) {
            //Make the spectrum fullscreen, disable waterfall
            this.parts[0].Update(width, height, this.persist.offset, this.persist.range);
            this.parts[0].SetEnabled(true);
            this.parts[0].SetOffset(0);
            this.parts[1].SetEnabled(false);
            this.parts[1].Update(width, 0, this.persist.offset, this.persist.range);

            //Move slider to bottom
            this.slider.style.top = (height - 15) + "px";
        } else {
            //Make the spectrum set to the set height, make waterfall fill the rest
            this.parts[0].Update(width, this.spectrumHeight, this.persist.offset, this.persist.range);
            this.parts[1].Update(width, height - this.spectrumHeight, this.persist.offset, this.persist.range);
            this.parts[0].SetOffset(0);
            this.parts[1].SetOffset(this.spectrumHeight);
            this.parts[0].SetEnabled(true);
            this.parts[1].SetEnabled(true);

            //Move slider to edge
            this.slider.style.top = (this.spectrumHeight - 15) + "px";
        }

        //Configure settings
        this.SettingsChanged();

        //Update persistent settings
        this.persist.spectrumHeightPercent = this.spectrumHeight / height;
    }

    private CreateContainer(win: HTMLElement): HTMLElement {
        var e = document.createElement("div");
        e.style.position = "absolute";
        win.appendChild(e);
        return e;
    }

    private CreateSliderIcon(container: HTMLElement, flipped: boolean) {
        var e = document.createElement("div");
        e.style.width = "15px";
        e.style.backgroundImage = "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0J" +
            "veD0iMCAwIDI0IDI0IiB3aWR0aD0iMjRweCIgZmlsbD0iI0ZGRkZGRiI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTEyIDhsLT" +
            "YgNiAxLjQxIDEuNDFMMTIgMTAuODNsNC41OSA0LjU4TDE4IDE0bC02LTZ6Ii8+PC9zdmc+)";
        e.style.backgroundSize = "13px";
        e.style.backgroundRepeat = "no-repeat";
        e.style.backgroundPosition = "center";
        e.style.height = "100%";
        e.style.flexGrow = "1";
        e.style.pointerEvents = "none";
        e.style.opacity = "0.7";
        if (flipped)
            e.style.transform = "scaleY(-1)";
        container.appendChild(e);
    }

}