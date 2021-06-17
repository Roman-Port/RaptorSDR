import IRaptorDraggingEvents from "./IRaptorDraggingEvents";
import RaptorDomBuilder from "./RaptorDomBuilder";

export default class RaptorUiUtil {

    static CreateDom(type: string, classname?: string, parent?: HTMLElement): RaptorDomBuilder {
        //Create
        var e = document.createElement(type) as RaptorDomBuilder;

        //Set custom prototypes. Ugly but it works
        e.SetStyleAttribute = function (key: string, value: string) {
            this.style[key] = value;
            return this;
        };
        e.Chain = function (callback: (node: RaptorDomBuilder) => void) {
            callback(this);
            return this;
        };
        e.SetText = function (text: string) {
            this.innerText = text;
            return this;
        };
        e.AddClass = function (name: string) {
            this.classList.add(name);
            return this;
        }

        //Apply
        if (classname != null) {
            e.classList.add(classname);
        }
        if (parent != null) {
            parent.appendChild(e);
        }

        //Cast
        return e;
    }

    private static currentDraggingItem?: RaptorDraggingElement;
    private static currentDraggingStarted: boolean = false;
    private static draggingBound: boolean = false;

    static AddDragEvents(element: HTMLElement, events: IRaptorDraggingEvents) {
        //Bind global events if needed
        if (!this.draggingBound) {
            window.addEventListener("mousemove", (evt: MouseEvent) => {
                if (this.currentDraggingItem != null) {
                    if (!this.currentDraggingStarted && this.currentDraggingItem.xraptor_dragging_event.DragBegin != null)
                        this.currentDraggingItem.xraptor_dragging_event.DragBegin(evt, this.currentDraggingItem);
                    if (this.currentDraggingItem.xraptor_dragging_event.DragMove != null)
                        this.currentDraggingItem.xraptor_dragging_event.DragMove(evt, this.currentDraggingItem);
                    this.currentDraggingStarted = true;
                    evt.preventDefault();
                    evt.stopPropagation();
                }
            });
            window.addEventListener("mouseup", (evt: MouseEvent) => {
                if (this.currentDraggingStarted && this.currentDraggingItem != null) {
                    if (this.currentDraggingItem.xraptor_dragging_event.DragEnd != null)
                        this.currentDraggingItem.xraptor_dragging_event.DragEnd(evt, this.currentDraggingItem);
                    this.currentDraggingItem = null;
                    this.currentDraggingStarted = false;
                    evt.preventDefault();
                    evt.stopPropagation();
                }
            });
            this.draggingBound = true;
        }

        //Apply events
        (element as RaptorDraggingElement).xraptor_dragging_event = events;

        //Bind events to element
        element.addEventListener("mousedown", (evt: MouseEvent) => {
            if (this.currentDraggingItem != null)
                return;
            this.currentDraggingItem = evt.currentTarget as RaptorDraggingElement;
            this.currentDraggingStarted = false;
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    static ForceBeginDrag(element: HTMLElement) {
        this.currentDraggingItem = element as RaptorDraggingElement;
        this.currentDraggingStarted = false;
    }

}

interface RaptorDraggingElement extends HTMLElement {

    xraptor_dragging_event?: IRaptorDraggingEvents;

}