import IRaptorConnection from "../sdk/IRaptorConnection";
import IRaptorWindow from "../sdk/ui/core/IRaptorWindow";
import RaptorSize from "../sdk/ui/RaptorSize";
import BaseSpectrumPart from "./BaseSpectrumPart";
import SpectrumPart from "./parts/SpectrumPart";
import WaterfallPart from "./parts/WaterfallPart";
import { SpectrumDisplayMode } from "./SpectrumDisplayMode";
import SpectrumInfo from "./SpectrumInfo";
import SpectrumStream from "./SpectrumStream";

export default class SpectrumWindow implements IRaptorWindow {

    constructor(conn: IRaptorConnection, info: SpectrumInfo) {
        this.conn = conn;
        this.info = info;
        this.spectrumHeight = 500;
    }

    private conn: IRaptorConnection;
    private info: SpectrumInfo;
    private sock: SpectrumStream;
    private parts: BaseSpectrumPart[];
    private spectrumHeight: number; //only applies to hybrid mode
    private window: HTMLElement;
    private slider: HTMLElement;
    private sliderDragging: boolean;
    private lastFrame: Float32Array = new Float32Array(1);

    static PADDING_WIDTH: number = 30;

    GetWindowName(): string {
        return this.info.name;
    }

    CreateWindow(win: HTMLElement): void {
        //Configure
        this.window = win;

        //Create stream
        this.sock = new SpectrumStream(this.conn, this.info, true);

        //Create parts
        this.parts = [
            new SpectrumPart(this.CreateContainer(win)),
            new WaterfallPart(this.CreateContainer(win))
        ];

        //Bind draw
        this.sock.FrameReceived.Bind((frame: Float32Array) => {
            this.lastFrame = frame;
            for (var i = 0; i < this.parts.length; i++) {
                this.parts[i].ProcessFrame(frame);
            }
        });

        //Create the slider
        this.slider = this.CreateContainer(win);
        this.slider.style.width = "15px";
        this.slider.style.height = "31px";
        this.slider.style.right = "0";
        this.slider.style.zIndex = "99";
        this.slider.style.borderRadius = "5px";
        this.slider.style.backgroundColor = "#2C2F33";
        this.slider.addEventListener("mousedown", () => this.sliderDragging = true);
        window.addEventListener("mouseup", () => this.sliderDragging = false);
        window.addEventListener("mousemove", (evt: MouseEvent) => {
            if (this.sliderDragging) {
                this.spectrumHeight += evt.movementY;
                this.ConfigureLayout();
            }
        });
    }

    DestoryWindow(): void {
        
    }

    ResizeWindow(width: number, height: number) {
        //If height is 0, abort
        if (height == 0) { return; }

        //Configure
        this.ConfigureLayout();

        //Send resize command to server
        this.sock.SetSize(width - SpectrumWindow.PADDING_WIDTH);
    }

    private ConfigureLayout() {
        //Get total width and height
        var height = this.window.clientHeight;
        var width = this.window.clientWidth;

        //Constrain height
        this.spectrumHeight = Math.max(0, Math.min(this.window.clientHeight, this.spectrumHeight));

        //Move slider to edge
        this.slider.style.top = (this.spectrumHeight - 15) + "px";

        //Configure depending on mode
        if (this.spectrumHeight < 30) {
            //Make the waterfall fullscreen, disable spectrum
            this.parts[1].Resize(width, height);
            this.parts[1].SetEnabled(true);
            this.parts[1].SetOffset(0);
            this.parts[0].SetEnabled(false);
            this.parts[0].Resize(width, height);
        } else if ((this.window.clientHeight - this.spectrumHeight) < 30) {
            //Make the spectrum fullscreen, disable waterfall
            this.parts[0].Resize(width, height);
            this.parts[0].SetEnabled(true);
            this.parts[0].SetOffset(0);
            this.parts[1].SetEnabled(false);
            this.parts[1].Resize(width, height);
        } else {
            //Make the spectrum set to the set height, make waterfall fill the rest
            this.parts[0].Resize(width, this.spectrumHeight);
            this.parts[1].Resize(width, height - this.spectrumHeight);
            this.parts[0].SetOffset(0);
            this.parts[1].SetOffset(this.spectrumHeight);
            this.parts[0].SetEnabled(true);
            this.parts[1].SetEnabled(true);
        }

        //Finally, resend last frame to parts so they don't flicker
        for (var i = 0; i < this.parts.length; i++) {
            this.parts[i].ProcessFrame(this.lastFrame);
        }
    }

    private CreateContainer(win: HTMLElement): HTMLElement {
        var e = document.createElement("div");
        e.style.position = "absolute";
        win.appendChild(e);
        return e;
    }

}