import BaseChildWindowMount from "../BaseChildWindowMount";
import BaseWindowMount from "../BaseWindowMount";
import RaptorWindowWrapper from "../RaptorWindowWrapper";
import WindowDropZone from "../WindowDropZone";
import { WindowResizeDirection } from "../WindowResizeDirection";
import BaseStripeWindowMount from "./BaseStripeWindowMount";
import StripeCell from "./StripeCell";
import StripeWindowMount from "./StripeWindowMount";

export default class StripCenterWindowMount extends BaseStripeWindowMount {

    constructor(parent: StripeWindowMount) {
        super(parent);

        //Configure dropzones
        this.dropzone.MoveToFill();
    }

    LayoutChildren(width: number, height: number) {
        //Set all children to fill this as well
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].UpdateLayout(width, height, 0, 0, 0, 0);
        }
    }

    AddChild<T extends BaseChildWindowMount>(child: T, insertBeforeIndex?: number): T {
        this.dropzone.Disable();
        return super.AddChild(child, insertBeforeIndex);
    }

    RemoveChild(child: BaseChildWindowMount) {
        this.dropzone.Enable();
        super.RemoveChild(child);
    }

    ResizeAllowed(dir: WindowResizeDirection): boolean {
        return false;
    }

    Resize(dir: WindowResizeDirection, delta: number) {

    }

    ChildResizeAllowed(child: BaseChildWindowMount, direction: WindowResizeDirection): boolean {
        return false;
    }

    ChildResize(child: BaseChildWindowMount, direction: WindowResizeDirection, delta: number): void {
        throw new Error("Method not implemented.");
    }


}