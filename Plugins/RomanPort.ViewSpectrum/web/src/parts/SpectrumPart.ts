import IRaptorConfigurable from "../../sdk/misc/IRaptorConfigurable";
import BasePart from "./BasePart";
import { SpectrumFreqDisplayMode } from "../config/SpectrumFreqDisplayMode";
import ISpectrumInfo from "../config/SpectrumInfo";
import SpectrumPainter from "../Util/SpectrumPainter";
import SpectrumScaleBuilder from "../Util/SpectrumScaleBuilder";

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

    Update(width: number, height: number, offset: number, range: number) {
        super.Update(width, height - SpectrumPart.PADDING_HEIGHT, offset, range);

        //Save
        this.height = height;
        this.width = width;

        //Make gradients
        this.foregroundGradient = SpectrumPainter.MakeGradient(this.mainCanvasContext, height - SpectrumPart.PADDING_HEIGHT, "#70b4ff", "#000050");
        this.backgroundGradient = SpectrumPainter.MakeGradient(this.mainCanvasContext, height - SpectrumPart.PADDING_HEIGHT, "#345375", "#000014");
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
        SpectrumPainter.PaintSpectrum(this.mainCanvasContext, this.mainCanvas.width, this.mainCanvas.height, frame, this.foregroundGradient, this.backgroundGradient);
    }

}