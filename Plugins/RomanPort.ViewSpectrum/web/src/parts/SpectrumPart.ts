import BaseSpectrumPart from "../BaseSpectrumPart";
import SpectrumScaleBuilder from "../Util/SpectrumScaleBuilder";

export default class SpectrumPart extends BaseSpectrumPart {

    constructor(container: HTMLElement) {
        super(container);

        //Make scale canvas
        this.scaleCanvas = document.createElement("canvas");
        container.appendChild(this.scaleCanvas);
        this.scaleCanvas.style.position = "absolute";
        this.scaleCanvas.style.top = "0";
        this.scaleCanvas.style.left = "0";
        this.scaleCanvas.style.pointerEvents = "none";
    }

    private scaleCanvas: HTMLCanvasElement;

    private backgroundGradient: CanvasGradient;
    private foregroundGradient: CanvasGradient;

    Resize(width: number, height: number) {
        super.Resize(width, height);

        //Make gradients
        this.foregroundGradient = this.mainCanvasContext.createLinearGradient(0, 0, 0, height);
        this.foregroundGradient.addColorStop(0, "#70b4ff");
        this.foregroundGradient.addColorStop(1, "#000050");
        this.backgroundGradient = this.mainCanvasContext.createLinearGradient(0, 0, 0, height);
        this.backgroundGradient.addColorStop(0, "#345375");
        this.backgroundGradient.addColorStop(1, "#000014");

        //Redraw the scale
        if (width > 0 && height > 0 && this.enabled) {
            new SpectrumScaleBuilder(this.scaleCanvas, width, height)
                .DrawYAxis(0, 80, 5)
                .Apply();
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