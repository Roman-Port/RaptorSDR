import SpectrumWindow from "./SpectrumWindow";

export default abstract class BaseSpectrumPart {

    constructor(container: HTMLElement) {
        //Configure
        this.container = container;
        this.enabled = true;

        //Set up container
        this.container.style.display = "absolute";
        this.container.style.left = "0";
        this.container.style.right = "0";
        this.container.style.backgroundColor = "black";
        this.SetOffset(0);

        //Create default components
        this.mainCanvas = this.CreateComponent("canvas") as HTMLCanvasElement;
        this.mainCanvasContext = this.mainCanvas.getContext("2d");
        this.mainCanvas.style.position = "absolute";
        this.mainCanvas.style.left = (SpectrumWindow.PADDING_WIDTH / 2) + "px";
        this.mainCanvas.style.top = "0";
    }

    protected container: HTMLElement;
    protected mainCanvas: HTMLCanvasElement;
    protected mainCanvasContext: CanvasRenderingContext2D;
    protected enabled: boolean;

    Resize(width: number, height: number): void {
        this.mainCanvas.width = width - SpectrumWindow.PADDING_WIDTH;
        this.mainCanvas.height = height;
        this.container.style.height = height + "px";
    }

    SetOffset(offset: number) {
        this.container.style.top = offset + "px";
    }

    SetEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    ProcessFrame(frame: Float32Array): void {
        if (this.enabled) {
            this.DrawFrame(frame);
        }
    }

    protected abstract DrawFrame(frame: Float32Array): void;

    protected CreateComponent(tag: string): HTMLElement {
        var e = document.createElement(tag);
        this.container.appendChild(e);
        return e;
    }

}