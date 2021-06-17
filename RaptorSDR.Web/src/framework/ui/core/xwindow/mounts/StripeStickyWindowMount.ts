import BaseChildWindowMount from "../BaseChildWindowMount";
import BaseWindowMount from "../BaseWindowMount";
import RaptorWindowWrapper from "../RaptorWindowWrapper";
import WindowDropZone from "../WindowDropZone";
import { WindowResizeDirection } from "../WindowResizeDirection";
import BaseStripeWindowMount from "./BaseStripeWindowMount";
import StripeCell from "./StripeCell";
import StripeWindowMount from "./StripeWindowMount";

export default class StripStickyWindowMount extends BaseStripeWindowMount {
    
    constructor(parent: StripeWindowMount, resizeDirection: WindowResizeDirection) {
        super(parent);
        this.stripe = parent;
        this.resizeDirection = resizeDirection;

        //Configure dropzones
        this.dropzone.MoveToEdge(parent.isVertical ? WindowResizeDirection.TOP : WindowResizeDirection.LEFT);
    }

    private resizeDirection: WindowResizeDirection;

    protected ResizeAllowed(dir: WindowResizeDirection): boolean {
        return false;
    }

    LayoutChildren(width: number, height: number) {
        var offset = 0;
        for (var i = 0; i < this.children.length; i++) {
            var size = (this.children[i] as StripeCell).windowSize;
            if (this.stripe.isVertical) {
                this.children[i].UpdateLayout(width, size, offset, null, 0, 0);
            } else {
                this.children[i].UpdateLayout(size, height, 0, 0, offset, null);
            }
            offset += size;
        }
    }

    ChildResizeAllowed(child: BaseChildWindowMount, direction: WindowResizeDirection): boolean {
        return direction == this.resizeDirection; //Facing the same direction but not the last child
    }

    ChildResize(child: StripeCell, direction: WindowResizeDirection, delta: number): void {
        //Update the size
        child.windowSize += delta;

        //Constrain
        if (child.windowSize < child.minSize)
            child.windowSize = child.minSize;
        if (child.windowSize > child.maxSize)
            child.windowSize = child.maxSize;

        //Update
        this.stripe.Refresh();
    }

    QueryElementsHeight(): number {
        var size = 0;
        for (var i = 0; i < this.children.length; i++) {
            size += (this.children[i] as StripeCell).windowSize;
        }
        return size;
    }

}