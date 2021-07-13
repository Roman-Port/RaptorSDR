import IRaptorConfigurable from "../../sdk/misc/IRaptorConfigurable";
import BasePart from "./BasePart";
import { SpectrumFreqDisplayMode } from "../config/SpectrumFreqDisplayMode";
import ISpectrumInfo from "../config/SpectrumInfo";
import SpectrumPainter from "../Util/SpectrumPainter";
import SpectrumScaleBuilder from "../Util/SpectrumScaleBuilder";
import ViewSpectrumPlugin from "../ViewSpectrumPlugin";

export default class SpectrumPart extends BasePart {

    constructor(container: HTMLElement, info: ISpectrumInfo, zoomed: IRaptorConfigurable<number>) {
        super(container);
        this.info = info;
        this.zoomed = zoomed;

        //Fix
        this.mainCanvas.style.top = SpectrumPart.PADDING_TOP + "px";

        //Make scale canvas
        this.scaleCanvas = document.createElement("canvas");
        container.appendChild(this.scaleCanvas);
        this.scaleCanvas.style.position = "absolute";
        this.scaleCanvas.style.top = "0";
        this.scaleCanvas.style.left = "0";
        this.scaleCanvas.style.pointerEvents = "none";
    }

    private info: ISpectrumInfo;
    private zoomed: IRaptorConfigurable<number>;
    private scaleCanvas: HTMLCanvasElement;

    private backgroundGradient: CanvasGradient;
    private foregroundGradient: CanvasGradient;

    private height: number = 0;
    private width: number = 0;

    static readonly PADDING_TOP: number = 5;
    static readonly PADDING_BOTTOM: number = 25;
    static readonly PADDING_HEIGHT: number = SpectrumPart.PADDING_TOP + SpectrumPart.PADDING_BOTTOM;

    static readonly COLOR_BACKGROUND_TOP: string = "#345375";
    static readonly COLOR_BACKGROUND_BOTTOM: string = "#000014";
    static readonly COLOR_FOREGROUND_TOP: string = "#70b4ff";
    static readonly COLOR_FOREGROUND_BOTTOM: string = "#000050";

    Update(width: number, height: number, offset: number, range: number) {
        super.Update(width, height - SpectrumPart.PADDING_HEIGHT, offset, range);

        //Save
        this.height = height;
        this.width = width;

        //Make gradients
        this.foregroundGradient = SpectrumPainter.MakeGradient(this.mainCanvasContext, height - SpectrumPart.PADDING_HEIGHT, SpectrumPart.COLOR_FOREGROUND_TOP, SpectrumPart.COLOR_FOREGROUND_BOTTOM);
        this.backgroundGradient = SpectrumPainter.MakeGradient(this.mainCanvasContext, height - SpectrumPart.PADDING_HEIGHT, SpectrumPart.COLOR_BACKGROUND_TOP, SpectrumPart.COLOR_BACKGROUND_BOTTOM);
    }

    SettingsChanged(freq: number, sampleRate: number, offsetDb: number, rangeDb: number): void {
        //Get values
        sampleRate = this.zoomed.GetValue();

        //Redraw the scale
        if (freq != null && sampleRate != null && offsetDb != null && rangeDb != null &&
            this.width > 0 && this.height > 0 && this.enabled && sampleRate != 0 && rangeDb != 0) {
            new SpectrumScaleBuilder(this.scaleCanvas, this.width, this.height)
                .DrawYAxis(offsetDb, rangeDb)
                .DrawXAxis(sampleRate, freq, this.info.fixedIncrement);
        }
    }

    protected DrawFrame(frame: Float32Array): void {
        //Paint
        SpectrumPainter.PaintSpectrum(this.mainCanvasContext, this.mainCanvas.width, this.mainCanvas.height, frame, this.foregroundGradient, this.backgroundGradient);

        //If the "debug paint" mode is on, print the canvas scaled to byte (0-255). This aids with creating the thumbnails used for dummies
        if (ViewSpectrumPlugin.CheckDebugOption("PAINT")) {
            //SLOW!
            var output = "";
            for (var i = 0; i < frame.length; i++)
                output += Math.floor(frame[i] * 255) + ", ";
            console.log("PAINT_DEBUG / " + this.info.name + " / " + output);
        }
    }

}