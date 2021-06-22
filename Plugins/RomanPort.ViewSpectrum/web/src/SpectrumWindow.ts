import IRaptorConnection from "../sdk/IRaptorConnection";
import IRaptorConfigurable from "../sdk/misc/IRaptorConfigurable";
import IRaptorWindow from "../sdk/ui/core/IRaptorWindow";
import IRaptorWindowContext from "../sdk/ui/core/IRaptorWindowContext";
import RaptorSize from "../sdk/ui/RaptorSize";
import { RaptorSettingsTab } from "../sdk/ui/setting/RaptorSettingsTab";
import IRaptorPrimitiveDataProvider from "../sdk/web/providers/IRaptorPrimitiveDataProvider";
import BaseSpectrumPart from "./BaseSpectrumPart";
import ISpectrumPersistSettings from "./ISpectrumPersistSettings";
import SpectrumPart from "./parts/SpectrumPart";
import WaterfallPart from "./parts/WaterfallPart";
import { SpectrumDisplayMode } from "./SpectrumDisplayMode";
import ISpectrumInfo from "./SpectrumInfo";
import SpectrumStream from "./SpectrumStream";
import ConfigOptionWrapper from "./Util/ConfigOptionWrapper";

export default class SpectrumWindow implements IRaptorWindow {

    constructor(ctx: IRaptorWindowContext) {
        this.ctx = ctx;
        this.conn = ctx.conn;
        this.info = ctx.info as ISpectrumInfo;
        this.persist = ctx.persist as ISpectrumPersistSettings;

        //Make sure that persistent values have their default values set
        this.PersistSetDefault("offset", this.info.defaultOffset);
        this.PersistSetDefault("range", this.info.defaultRange);
        this.PersistSetDefault("attack", this.info.defaultAttack);
        this.PersistSetDefault("decay", this.info.defaultDecay);

        //Create settings panel
        var settings = ctx.CreateSettingsRegion(this.info.name + " Settings", "settings")
            .AddOptionRange("Offset", new ConfigOptionWrapper(this, "offset", (value: number) => this.sock.SetOffset(value)), 0, 200)
            .AddOptionRange("Range", new ConfigOptionWrapper(this, "range", (value: number) => this.sock.SetRange(value)), 1, 200)
            .AddOptionRange("Attack", new ConfigOptionWrapper(this, "attack", (value: number) => this.sock.SetAttack(value), 100), 0, 100)
            .AddOptionRange("Decay", new ConfigOptionWrapper(this, "decay", (value: number) => this.sock.SetDecay(value), 100), 0, 100)
            .Build();
        ctx.RegisterSettingsRegionSidebar(settings, RaptorSettingsTab.GENRAL);
    }

    conn: IRaptorConnection;
    ctx: IRaptorWindowContext;
    info: ISpectrumInfo;
    persist: ISpectrumPersistSettings;
    sock: SpectrumStream;

    private parts: BaseSpectrumPart[] = [];
    private spectrumHeight: number; //only applies to hybrid mode
    private window: HTMLElement;
    private slider: HTMLElement;
    private sliderDragging: boolean;
    private persistentSpectrumHeightUpdated: boolean = false;
    private freqDataProvider: IRaptorPrimitiveDataProvider<number>;

    static readonly PADDING_LEFT: number = 25;
    static readonly PADDING_RIGHT: number = 15;
    static readonly PADDING_WIDTH: number = SpectrumWindow.PADDING_LEFT + SpectrumWindow.PADDING_RIGHT;

    GetWindowName(): string {
        return this.info.name;
    }

    CreateWindow(win: HTMLElement): void {
        //Configure
        this.window = win;

        //Get the data provider for the frequency (if any)
        if (this.info.freqDataProvider != null) {
            this.freqDataProvider = this.conn.GetPrimitiveDataProvider<number>(this.info.freqDataProvider);
            this.freqDataProvider.OnChanged.Bind(() => {
                this.SettingsChanged();
            });
        }

        //Create stream
        this.sock = new SpectrumStream(this.conn, this.info, true);
        this.sock.SampleRateChanged.Bind(() => { this.SettingsChanged(); });
        this.sock.SetOffset(this.persist.offset);
        this.sock.SetRange(this.persist.range);
        this.sock.SetAttack(this.persist.attack);
        this.sock.SetDecay(this.persist.decay);

        //Create parts
        this.parts = [
            new SpectrumPart(this.CreateContainer(win), this.info),
            new WaterfallPart(this.CreateContainer(win))
        ];

        //Bind draw
        this.sock.FrameReceived.Bind((frame: Float32Array) => {
            for (var i = 0; i < this.parts.length; i++) {
                this.parts[i].ProcessFrame(frame);
            }
        });

        //Create the slider
        this.slider = this.CreateContainer(win);
        this.slider.style.width = "15px";
        this.slider.style.height = "32px";
        this.slider.style.right = "0";
        this.slider.style.zIndex = "99";
        this.slider.style.borderRadius = "3px";
        this.slider.style.cursor = "pointer";
        this.slider.style.backgroundColor = "#2C2F33";
        this.slider.style.display = "flex";
        this.slider.style.flexDirection = "column";
        this.slider.addEventListener("mousedown", () => this.sliderDragging = true);
        this.CreateSliderIcon(this.slider, false);
        this.CreateSliderIcon(this.slider, true);
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
        for (var i = 0; i < this.parts.length; i++)
            this.parts[i].SettingsChanged(
                this.freqDataProvider == null ? 0 : this.freqDataProvider.GetValue(),
                this.sock.GetSampleRate(),
                this.persist.offset,
                this.persist.range
            );
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

    private PersistSetDefault<T>(persistKey: string, defaultValue: T) {
        var persist = this.persist as any;
        if (persist[persistKey] == null)
            persist[persistKey] = defaultValue;
    }

}