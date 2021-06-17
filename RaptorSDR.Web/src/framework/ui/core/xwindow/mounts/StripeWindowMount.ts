import RaptorEventDispaptcher from "../../../../../../sdk/RaptorEventDispatcher";
import { RaptorWindowMounting } from "../../../../../../sdk/ui/core/RaptorWindowMounting";
import BaseChildWindowMount from "../BaseChildWindowMount";
import BaseWindowMount from "../BaseWindowMount";
import RaptorWindowWrapper from "../RaptorWindowWrapper";
import { WindowResizeDirection } from "../WindowResizeDirection";
import StripeCell from "./StripeCell";
import StripCenterWindowMount from "./StripeCenterWindowMount";
import StripStickyWindowMount from "./StripeStickyWindowMount";

export default class StripeWindowMount extends BaseChildWindowMount {

    constructor(parent: BaseWindowMount, isVertical: boolean) {
        super(parent);
        this.isVertical = isVertical;
        this.mountStart = this.AddChild(new StripStickyWindowMount(this, this.isVertical ? WindowResizeDirection.BOTTOM : WindowResizeDirection.RIGHT));
        this.mountCenter = this.AddChild(new StripCenterWindowMount(this));
        this.mountEnd = this.AddChild(new StripStickyWindowMount(this, this.isVertical ? WindowResizeDirection.TOP : WindowResizeDirection.LEFT));
    }

    private mountStart: StripStickyWindowMount;
    private mountCenter: StripCenterWindowMount;
    private mountEnd: StripStickyWindowMount;
    isVertical: boolean; //If true, start is top, otherwise start is left

    OnMadeEmpty: RaptorEventDispaptcher<void> = new RaptorEventDispaptcher();

    AddWindow(window: RaptorWindowWrapper, mount?: RaptorWindowMounting) {
        switch (mount) {
            case RaptorWindowMounting.Top:
                return this.mountStart.AddWindow(window);
            case RaptorWindowMounting.Bottom:
                return this.mountEnd.AddWindow(window);
            case RaptorWindowMounting.Center:
            default:
                return this.mountCenter.AddWindow(window);
        }
        
    }

    ChildResizeAllowed(child: BaseChildWindowMount, direction: WindowResizeDirection): boolean {
        //Should never be ran...
        return false;
    }

    ChildResize(child: BaseChildWindowMount, direction: WindowResizeDirection, delta: number): void {
        //Should never be ran...
    }

    LayoutChildren(width: number, height: number) {
        //Query heights from start and end
        var startSize = this.mountStart.QueryElementsHeight();
        var endSize = this.mountEnd.QueryElementsHeight();

        //Apply layout to children
        this.UpdateChildLayoutRespectDirection(width, height, this.mountStart, startSize, 0, null);
        this.UpdateChildLayoutRespectDirection(width, height, this.mountEnd, endSize, null, 0);
        this.UpdateChildLayoutRespectDirection(width, height, this.mountCenter, this.GetSizeRespectDirection() - startSize - endSize, startSize, endSize);
    }

    private GetSizeRespectDirection(): number {
        return this.isVertical ? this.GetHeight() : this.GetWidth();
    }

    private UpdateChildLayoutRespectDirection(windowWidth: number, windowHeight: number, child: BaseChildWindowMount, size: number, fromStart?: number, fromEnd?: number) {
        if (this.isVertical) {
            child.UpdateLayout(windowWidth, size, fromStart, fromEnd, null, null);
        } else {
            child.UpdateLayout(size, windowHeight, null, null, fromStart, fromEnd);
        }
    }

    ChildCellRemoved() {
        //Check if all children are empty
        if (this.GetCellCount() == 0)
            this.OnMadeEmpty.Fire();
    }

    GetCellCount(): number {
        return this.mountStart.GetCellCount() + this.mountCenter.GetCellCount() + this.mountEnd.GetCellCount();
    }

    SerializeSave() {
        return [
            this.mountStart.SerializeSave(),
            this.mountCenter.SerializeSave(),
            this.mountEnd.SerializeSave()
        ];
    }

    SerializeRestore(data: any) {
        this.mountStart.SerializeRestore(data[0]);
        this.mountCenter.SerializeRestore(data[1]);
        this.mountEnd.SerializeRestore(data[2]);
    }

}