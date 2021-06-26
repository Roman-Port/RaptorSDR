import IRaptorConfigurable from "../../sdk/misc/IRaptorConfigurable";
import RaptorUiUtil from "../../sdk/util/RaptorUiUtil";
import SpectrumWindow from "../SpectrumWindow";
import SpectrumPainter from "../Util/SpectrumPainter";

export default class SpectrumZoomPreview {

    constructor(zoom: IRaptorConfigurable<number>, center: IRaptorConfigurable<number>) {
        //Configure
        this.zoom = zoom;
        this.center = center;

        //Make main mount
        this.mount = RaptorUiUtil.CreateDom("div", "rplug_spectrum_preview")
            .SetStyleAttribute("top", "20px")
            .SetStyleAttribute("left", (SpectrumWindow.PADDING_LEFT + 15) + "px")
            .SetStyleAttribute("right", (SpectrumWindow.PADDING_RIGHT + 15) + "px")
            .SetStyleAttribute("height", SpectrumZoomPreview.HEIGHT + "px");

        //Make the canvas
        this.canvas = RaptorUiUtil.CreateDom("canvas", null, this.mount)
            .SetStyleAttribute("width", "100%")
            .SetStyleAttribute("height", "100%") as HTMLElement as HTMLCanvasElement;
        this.context = this.canvas.getContext("2d");

        //Make picker region
        this.region = RaptorUiUtil.CreateDom("div", null, this.mount)
            .SetStyleAttribute("position", "absolute")
            .SetStyleAttribute("border-left", "1px solid black")
            .SetStyleAttribute("border-right", "1px solid black")
            .SetStyleAttribute("top", "0")
            .SetStyleAttribute("bottom", "0");

        //Make the two darker masks on either side of the picker
        this.CreatePickerMask(true);
        this.CreatePickerMask(false);

        //Create gradients
        this.foregroundGradient = SpectrumPainter.MakeGradient(this.context, SpectrumZoomPreview.HEIGHT, "#70b4ff", "#000050");
        this.backgroundGradient = SpectrumPainter.MakeGradient(this.context, SpectrumZoomPreview.HEIGHT, "#345375", "#000014");

        //Bind
        RaptorUiUtil.AddDragEvents(this.region, {
            DragBegin: (evt: MouseEvent) => {
                var rect = this.region.getBoundingClientRect();
                this.dragOffset = (evt.clientX - rect.left) - (rect.width / 2);
            },
            DragMove: (evt: MouseEvent) => {
                var rect = this.mount.getBoundingClientRect();
                var center = (evt.clientX - rect.left - this.dragOffset) / rect.width;
                this.UpdateConstrainedCenter(center);
            }
        });
    }

    mount: HTMLElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    region: HTMLElement;

    private zoom: IRaptorConfigurable<number>;
    private center: IRaptorConfigurable<number>;
    private dragOffset: number;
    private foregroundGradient: CanvasGradient;
    private backgroundGradient: CanvasGradient;

    private static readonly HEIGHT: number = 60;

    MountTo(container: HTMLElement) {
        container.appendChild(this.mount);
    }

    AddFrame(frame: Float32Array) {
        //Resize
        this.canvas.width = frame.length;
        this.canvas.height = SpectrumZoomPreview.HEIGHT;

        //Paint
        SpectrumPainter.PaintSpectrum(this.context, frame.length, SpectrumZoomPreview.HEIGHT, frame, this.foregroundGradient, this.backgroundGradient);
    }

    UpdateRegion() {
        //Get width and center in pixels
        var zoomPx = this.canvas.width * this.zoom.GetValue();
        var zoomPxHalf = zoomPx / 2;
        var centerPx = this.canvas.width * this.center.GetValue();

        //Calculate bounds
        var left = centerPx - zoomPxHalf;
        var right = centerPx + zoomPxHalf;

        //Update
        this.region.style.left = left + "px";
        this.region.style.width = (right - left) + "px";
    }

    private UpdateConstrainedCenter(center: number) {
        var halfZoom = this.zoom.GetValue() / 2;
        this.center.SetValue(Math.max(halfZoom, Math.min(1 - halfZoom, center)));
    }

    private CreatePickerMask(swap: boolean) {
        var e = RaptorUiUtil.CreateDom("div", null, this.region)
            .SetStyleAttribute("position", "absolute")
            .SetStyleAttribute("top", "0")
            .SetStyleAttribute("bottom", "0")
            .SetStyleAttribute(swap ? "left" : "right", "0")
        RaptorUiUtil.CreateDom("div", null, e)
            .SetStyleAttribute("position", "absolute")
            .SetStyleAttribute("top", "0")
            .SetStyleAttribute("bottom", "0")
            .SetStyleAttribute("width", "100vw")
            .SetStyleAttribute("background", "#0000003b")
            .SetStyleAttribute(swap ? "right" : "left", "0")
    }

}