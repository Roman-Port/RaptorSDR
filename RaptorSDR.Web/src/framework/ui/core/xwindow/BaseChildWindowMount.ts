import RaptorUiUtil from "../../../../../sdk/util/RaptorUiUtil";
import BaseWindowMount from "./BaseWindowMount";
import { WindowResizeDirection } from "./WindowResizeDirection";

export default abstract class BaseChildWindowMount extends BaseWindowMount {

    constructor(parent: BaseWindowMount) {
        super();

        //Configure
        this.parent = parent;
        this.root = parent.root;

        //Create resize handles (in order of WindowResizeDirection)
        this.resizeHandles.push(this.CreateResizeHandle(true, false, "top", "left", "right")); //TOP
        this.resizeHandles.push(this.CreateResizeHandle(true, true, "bottom", "left", "right")); //BOTTOM
        this.resizeHandles.push(this.CreateResizeHandle(false, false, "left",   "top",  "bottom")); //LEFT
        this.resizeHandles.push(this.CreateResizeHandle(false, true, "right", "top", "bottom")); //RIGHT
    }

    protected parent: BaseWindowMount;
    private resizeHandles: HTMLElement[] = [];
    private width: number;
    private height: number;

    abstract SerializeSave(): any;
    abstract SerializeRestore(data: any): any;

    UpdateLayout(width: number, height: number, top?: number, bottom?: number, left?: number, right?: number) {
        //Update node options
        this.body.style.width = width == null ? null : width + "px";
        this.body.style.height = height == null ? null : height + "px";
        this.body.style.top = top == null ? null : top + "px";
        this.body.style.bottom = bottom == null ? null : bottom + "px";
        this.body.style.left = left == null ? null : left + "px";
        this.body.style.right = right == null ? null : right + "px";

        //Update local state
        this.width = width;
        this.height = height;

        //Layout children
        this.LayoutChildren(width, height);

        //Update active handles
        for (var i = 0; i < 4; i++) {
            var direction = i as WindowResizeDirection;
            if (this.ResizeAllowed(direction)) {
                this.resizeHandles[direction].style.display = "block";
            } else {
                this.resizeHandles[direction].style.display = "none";
            }
        }
    }

    abstract LayoutChildren(width: number, height: number): void;

    Refresh() {
        //Make the entire thing refresh
        this.root.Refresh();
    }

    GetWidth(): number {
        if (Number.isNaN(this.width))
            throw new Error("Attempted to read width before this object's layout was configured!");
        return this.width;
    }

    GetHeight(): number {
        if (Number.isNaN(this.height))
            throw new Error("Attempted to read height before this object's layout was configured!");
        return this.height;
    }

    RemoveChild(child: BaseChildWindowMount) {
        super.RemoveChild(child);
        this.parent.Refresh();
    }

    protected ResizeAllowed(dir: WindowResizeDirection): boolean {
        return this.parent.ChildResizeAllowed(this, dir);
    }

    protected Resize(dir: WindowResizeDirection, delta: number): void {
        this.parent.ChildResize(this, dir, delta);
    }

    private CreateResizeHandle(isVertical: boolean, isLowerRight: boolean, dirKey: string, adjDirStartKey: string, adjDirEndKey: string): HTMLElement {
        var e = document.createElement("div");
        this.body.appendChild(e);
        var style = e.style as any;
        var sizeKey = isVertical ? "height" : "width";
        style["position"] = "absolute";
        style[sizeKey] = "4px";
        style[dirKey] = "-2px";
        style[adjDirStartKey] = "0px";
        style[adjDirEndKey] = "0px";
        style["cursor"] = isVertical ? "n-resize" : "w-resize";
        RaptorUiUtil.AddDragEvents(e, {
            DragMove: (evt: MouseEvent, target: HTMLElement) => {
                var direction = this.resizeHandles.indexOf(target) as WindowResizeDirection;
                var delta = ((direction == WindowResizeDirection.TOP || direction == WindowResizeDirection.BOTTOM) ? evt.movementY : evt.movementX) *
                    ((direction == WindowResizeDirection.BOTTOM || direction == WindowResizeDirection.RIGHT) ? 1 : -1);
                //^ Gets the X or Y movement from the direction, then swaps it if it's in the lower right
                this.Resize(direction, delta);
            },
            DragEnd: () => {
                //Save
                this.SaveLayout();
            }
        });
        return e;
    }

    SaveLayout(): void {
        this.root.SaveLayout();
    }

}