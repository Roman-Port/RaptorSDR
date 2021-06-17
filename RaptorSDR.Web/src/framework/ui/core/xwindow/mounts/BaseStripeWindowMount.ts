import BaseChildWindowMount from "../BaseChildWindowMount";
import RaptorRootWindowManager from "../RaptorRootWindowManager";
import RaptorWindowWrapper from "../RaptorWindowWrapper";
import WindowDropZone from "../WindowDropZone";
import StripeCell from "./StripeCell";
import StripeWindowMount from "./StripeWindowMount";

export default abstract class BaseStripeWindowMount extends BaseChildWindowMount {

    constructor(stripe: StripeWindowMount) {
        super(stripe);
        this.stripe = stripe;

        //Make dropzone
        this.dropzone = new WindowDropZone(this.body)
            .AddCallback((window: RaptorWindowWrapper) => {
                this.ChildCellDropZoneActivated(window, null);
            });
    }

    stripe: StripeWindowMount;
    protected dropzone: WindowDropZone;

    AddWindow(window: RaptorWindowWrapper, index?: number): StripeCell {
        //Insert
        var cell = this.AddChild(new StripeCell(this, this.stripe), index);
        cell.windowSize = this.stripe.isVertical ? window.defaultSize.y : window.defaultSize.x;
        if (cell.isSubStripe) {
            cell.subStripe.AddWindow(window);
        } else {
            cell.AddWindow(window);
        }

        //Update
        this.parent.Refresh();

        //Save
        this.SaveLayout();

        return cell;
    }

    RemoveWindow(window: RaptorWindowWrapper) {
        //Find the cell that contains this. This shouldn't ever fail
        var cell: StripeCell = null;
        for (var i = 0; i < this.children.length; i++) {
            var c = this.children[i] as StripeCell;
            if (c.window == window) {
                cell = c;
                break;
            }
        }

        //Validate
        if (cell == null)
            throw new Error("Couldn't find cell of window to remove!");

        //Remove the cell
        this.RemoveChild(cell);

        //Refresh parent
        this.stripe.ChildCellRemoved();
        this.parent.Refresh();

        //Save
        this.SaveLayout();
    }

    ChildCellDropZoneActivated(window: RaptorWindowWrapper, cell: StripeCell): void {
        this.AddWindow(window, this.children.indexOf(cell) + 1);
    }

    GetCellCount() {
        return this.children.length;
    }

    SerializeSave() {
        var e = [];
        for (var i = 0; i < this.children.length; i++)
            e.push(this.children[i].SerializeSave());
        return e;
    }

    SerializeRestore(data: any) {
        for (var i = 0; i < data.length; i++) {
            var cell = this.AddChild(new StripeCell(this, this.stripe));
            cell.SerializeRestore(data[i]);
        }
    }

}