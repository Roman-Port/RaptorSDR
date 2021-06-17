import RaptorSize from "../../../../../../sdk/ui/RaptorSize";
import BaseChildWindowMount from "../BaseChildWindowMount";
import RaptorRootWindowManager from "../RaptorRootWindowManager";
import RaptorWindowWrapper from "../RaptorWindowWrapper";
import WindowDropZone from "../WindowDropZone";
import { WindowResizeDirection } from "../WindowResizeDirection";
import BaseStripeWindowMount from "./BaseStripeWindowMount";
import StripeWindowMount from "./StripeWindowMount";

export default class StripeCell extends BaseChildWindowMount {

    constructor(container: BaseStripeWindowMount, stripe: StripeWindowMount) {
        super(container);
        this.mount = container;
        this.stripe = stripe;

        //If the host stripe is vertical, we should spawn a horizontal stripe here. Otherwise, this'll just be used to host normal windows 
        this.isSubStripe = stripe.isVertical;
        if (this.isSubStripe) {
            this.subStripe = this.AddChild(new StripeWindowMount(this, false));
            this.subStripe.OnMadeEmpty.Bind(() => {
                this.mount.RemoveChild(this);
            });
        }

        //Create dropzone
        this.dropzone = new WindowDropZone(this.body)
            .MoveToEdge(stripe.isVertical ? WindowResizeDirection.BOTTOM : WindowResizeDirection.RIGHT)
            .AddCallback((window: RaptorWindowWrapper) => {
                container.ChildCellDropZoneActivated(window, this);
            });
    }

    mount: BaseStripeWindowMount;
    stripe: StripeWindowMount;
    subStripe: StripeWindowMount;

    minSize: number;
    maxSize: number;

    windowSize: number = 100;
    isSubStripe: boolean;
    private dropzone: WindowDropZone;
    window: RaptorWindowWrapper;

    LayoutChildren(width: number, height: number) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].UpdateLayout(width, height, 0, 0, 0, 0);
        }
        if (this.window != null)
            this.window.ChangeSize(width, height);
    }

    ChildResizeAllowed(child: BaseChildWindowMount, direction: WindowResizeDirection): boolean {
        return false;
    }

    ChildResize(child: BaseChildWindowMount, direction: WindowResizeDirection, delta: number): void {
        
    }

    AddWindow(window: RaptorWindowWrapper) {
        this.window = window;
        this.minSize = this.GetSizeRespectDirection(window.minSize);
        this.maxSize = this.GetSizeRespectDirection(window.maxSize);
        this.windowSize = this.GetSizeRespectDirection(window.defaultSize);
        window.MoveTo(this.mount, this.body);
    }

    SerializeSave() {
        if (this.isSubStripe) {
            return this.subStripe.SerializeSave();
        } else {
            return {
                "size": this.windowSize,
                "info": this.window.GetSerializedInfo()
            };
        }
    }

    SerializeRestore(data: any) {
        if (this.isSubStripe) {
            this.subStripe.SerializeRestore(data);
        } else {
            this.windowSize = data["size"];
            this.AddWindow(new RaptorWindowWrapper(this.root as RaptorRootWindowManager, data["info"]));
        }
    }

    private GetSizeRespectDirection(size: RaptorSize): number {
        return this.stripe.isVertical ? size.y : size.x;
    }

}