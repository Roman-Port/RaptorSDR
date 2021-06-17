import RaptorUiUtil from "../../RaptorUiUtil";
import IWindowDropZoneElement from "./misc/IWindowDropZoneElement";
import RaptorWindowWrapper from "./RaptorWindowWrapper";
import { WindowResizeDirection } from "./WindowResizeDirection";

export default class WindowDropZone {

    constructor(container: HTMLElement) {
        this.dropzone = RaptorUiUtil.CreateDom("div", "sys_xwindow_dropzone", container) as IWindowDropZoneElement;
        RaptorUiUtil.CreateDom("div", "sys_window_dropzone_highlight", this.dropzone);
    }

    private dropzone: IWindowDropZoneElement;

    private static readonly DROPZONE_SIZE: number = 30;
    private static readonly DROPZONE_MARIGN: number = WindowDropZone.DROPZONE_SIZE / 2;

    AddCallback(callback: (window: RaptorWindowWrapper) => void): WindowDropZone {
        this.dropzone.xraptor_dropzone_dropped = (window: RaptorWindowWrapper) => callback(window);
        return this;
    }

    MoveToEdge(direction: WindowResizeDirection): WindowDropZone {
        switch (direction) {
            case WindowResizeDirection.TOP:
                this.dropzone.style.top = "-" + WindowDropZone.DROPZONE_MARIGN + "px";
            case WindowResizeDirection.BOTTOM:
                if (direction == WindowResizeDirection.BOTTOM)
                    this.dropzone.style.bottom = "-" + WindowDropZone.DROPZONE_MARIGN + "px";
                this.dropzone.style.left = "0px";
                this.dropzone.style.right = "0px";
                this.dropzone.style.height = WindowDropZone.DROPZONE_SIZE + "px";
                break;
            case WindowResizeDirection.LEFT:
                this.dropzone.style.left = "-" + WindowDropZone.DROPZONE_MARIGN + "px";
            case WindowResizeDirection.RIGHT:
                if (direction == WindowResizeDirection.RIGHT)
                    this.dropzone.style.right = "-" + WindowDropZone.DROPZONE_MARIGN + "px";
                this.dropzone.style.top = "0px";
                this.dropzone.style.bottom = "0px";
                this.dropzone.style.width = WindowDropZone.DROPZONE_SIZE + "px";
                break;
        }
        this.dropzone.classList.add("sys_xwindow_dropzone_largehighlight");
        return this;
    }

    MoveToFill(): WindowDropZone {
        this.dropzone.style.top = "5px";
        this.dropzone.style.bottom = "5px";
        this.dropzone.style.left = "5px";
        this.dropzone.style.right = "5px";
        this.dropzone.style.width = null;
        this.dropzone.style.height = null;
        this.dropzone.classList.remove("sys_xwindow_dropzone_largehighlight");
        return this;
    }

    Enable(): WindowDropZone {
        this.dropzone.style.display = "block";
        return this;
    }

    Disable(): WindowDropZone {
        this.dropzone.style.display = "none";
        return this;
    }

}