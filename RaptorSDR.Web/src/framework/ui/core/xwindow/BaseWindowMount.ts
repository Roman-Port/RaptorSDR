import BaseChildWindowMount from "./BaseChildWindowMount";
import { WindowResizeDirection } from "./WindowResizeDirection";

export default abstract class BaseWindowMount {

    constructor() {
        //Configure
        this.root = this;

        //Create body
        this.body = document.createElement("div");
        this.body.style.position = "absolute";
        this.body.style.background = "black";
        this.body.style.display = "block";
    }

    protected body: HTMLElement;
    protected children: BaseChildWindowMount[] = [];

    root: BaseWindowMount;

    Refresh() {
        //Refresh all children
        for (var i = 0; i < this.children.length; i++)
            this.children[i].UpdateLayout(this.body.clientWidth, this.body.clientHeight, 0, 0, 0, 0);
    }

    AddChild<T extends BaseChildWindowMount>(child: T, insertBeforeIndex?: number): T {
        if (insertBeforeIndex == null || insertBeforeIndex == this.children.length) {
            this.body.appendChild(child.body);
            this.children.push(child);
        } else {
            this.body.insertBefore(child.body, this.children[insertBeforeIndex].body);
            this.children.splice(insertBeforeIndex, 0, child);
        }
        return child;
    }

    RemoveChild(child: BaseChildWindowMount) {
        var index = this.children.indexOf(child);
        if (index == -1)
            throw new Error("Attempted to remove a child that we didn't have!");
        child.body.remove();
        this.children.splice(index, 1);
    }

    abstract GetWidth(): number;
    abstract GetHeight(): number;

    abstract ChildResizeAllowed(child: BaseChildWindowMount, direction: WindowResizeDirection): boolean;
    abstract ChildResize(child: BaseChildWindowMount, direction: WindowResizeDirection, delta: number): void;

    abstract SaveLayout(): void;

}