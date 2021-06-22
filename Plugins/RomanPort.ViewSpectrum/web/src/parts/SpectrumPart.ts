import BaseSpectrumPart from "../BaseSpectrumPart";
import { SpectrumFreqDisplayMode } from "../config/SpectrumFreqDisplayMode";
import ISpectrumInfo from "../SpectrumInfo";
import SpectrumScaleBuilder from "../Util/SpectrumScaleBuilder";

export default class SpectrumPart extends BaseSpectrumPart {

    constructor(container: HTMLElement, info: ISpectrumInfo) {
        super(container);
        this.info = info;

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
        this.foregroundGradient = this.mainCanvasContext.createLinearGradient(0, 0, 0, height - SpectrumPart.PADDING_HEIGHT);
        this.foregroundGradient.addColorStop(0, "#70b4ff");
        this.foregroundGradient.addColorStop(1, "#000050");
        this.backgroundGradient = this.mainCanvasContext.createLinearGradient(0, 0, 0, height - SpectrumPart.PADDING_HEIGHT);
        this.backgroundGradient.addColorStop(0, "#345375");
        this.backgroundGradient.addColorStop(1, "#000014");
    }

    SettingsChanged(freq: number, sampleRate: number, offsetDb: number, rangeDb: number): void {
        //Redraw the scale
        if (freq != null && sampleRate != null && offsetDb != null && rangeDb != null &&
            this.width > 0 && this.height > 0 && this.enabled && sampleRate != 0 && rangeDb != 0) {
            new SpectrumScaleBuilder(this.scaleCanvas, this.width, this.height)
                .DrawYAxis(offsetDb, rangeDb)
                .DrawXAxis(sampleRate, freq, this.info.useCenterFreq, this.info.fixedIncrement);
        }
    }

    protected DrawFrame(frame: Float32Array): void {
        //Clear canvas
        this.mainCanvasContext.fillStyle = this.foregroundGradient;
        this.mainCanvasContext.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

        //Paint
        this.mainCanvasContext.beginPath();
        this.mainCanvasContext.moveTo(0, frame[0] * this.mainCanvas.height);
        this.mainCanvasContext.strokeStyle = "white";
        this.mainCanvasContext.fillStyle = this.backgroundGradient;
        var value: number;
        for (var i = 1; i < frame.length; i++) {
            value = Math.floor(frame[i] * this.mainCanvas.height);
            this.mainCanvasContext.lineTo(i, value);
            this.mainCanvasContext.fillRect(i, 0, 1, value);
        }
        this.mainCanvasContext.stroke();
    }

}