import RaptorUiUtil from "../../RaptorUiUtil";
import RaptorWindowView from "./RaptorWindowTab";
import IRaptorWindow from 'RaptorSdk/ui/core/IRaptorWindow';
import RaptorDomBuilder from "../../RaptorDomBuilder";
import { RaptorWindowMounting } from "RaptorSdk/ui/core/RaptorWindowMounting";

require("./window.css");

export default class RaptorWindowContainer {

    constructor(view: RaptorWindowView, settings: IRaptorWindow, mode: RaptorWindowMounting) {
        //Set
        this.view = view;
        this.settings = settings;

        //Create window
        this.box = RaptorUiUtil.CreateDom("div", "rsys_window_win", null);

        //Apply flags
        if (settings.GetIsHeaderless()) {
            this.box.classList.add("rsys_window_win_noheader");
        }

        //Create grabview, a bit that just shows the name while this is being moved around
        this.grabview = RaptorUiUtil.CreateDom("div", "rsys_window_win_grabview", this.box);
        this.grabview.innerText = settings.GetWindowName();

        //Create header
        this.header = RaptorUiUtil.CreateDom("div", "rsys_window_win_header", this.box);
        RaptorUiUtil.CreateDom("div", null, this.header).innerText = settings.GetWindowName();
        RaptorUiUtil.CreateDom("div", "rsys_window_win_header_close", this.header);

        //Create content
        this.content = RaptorUiUtil.CreateDom("div", "rsys_window_win_content", this.box);
        settings.CreateWindow(this.content);

        //Create resizing handles
        this.handleEvents = [null, null, null, null];
        this.handles = [
            RaptorUiUtil.CreateDom("div", null, this.box)
                .SetStyleAttribute("position", "absolute")
                .SetStyleAttribute("cursor", "n-resize")
                .SetStyleAttribute("top", "-2px")
                .SetStyleAttribute("left", "0")
                .SetStyleAttribute("right", "0")
                .SetStyleAttribute("height", "4px")
                .Chain((node: RaptorDomBuilder) => node.addEventListener("mousedown", (evt: MouseEvent) => {
                    (node as any)._dragging = true;
                    evt.preventDefault();
                    evt.stopPropagation();
                }))
                .Chain((node: RaptorDomBuilder) => window.addEventListener("mousemove", (evt: MouseEvent) => {
                    if ((node as any)._dragging) {
                        this.handleEvents[0](evt);
                    }
                    evt.preventDefault();
                    evt.stopPropagation();
                }))
                .Chain((node: RaptorDomBuilder) => window.addEventListener("mouseup", (evt: MouseEvent) => {
                    (node as any)._dragging = false;
                    evt.preventDefault();
                    evt.stopPropagation();
                })),
            RaptorUiUtil.CreateDom("div", null, this.box)
                .SetStyleAttribute("position", "absolute")
                .SetStyleAttribute("cursor", "n-resize")
                .SetStyleAttribute("bottom", "-2px")
                .SetStyleAttribute("left", "0")
                .SetStyleAttribute("right", "0")
                .SetStyleAttribute("height", "4px")
                .Chain((node: RaptorDomBuilder) => node.addEventListener("mousedown", (evt: MouseEvent) => {
                    (node as any)._dragging = true;
                    evt.preventDefault();
                    evt.stopPropagation();
                }))
                .Chain((node: RaptorDomBuilder) => window.addEventListener("mousemove", (evt: MouseEvent) => {
                    if ((node as any)._dragging) {
                        this.handleEvents[1](evt);
                    }
                    evt.preventDefault();
                    evt.stopPropagation();
                }))
                .Chain((node: RaptorDomBuilder) => window.addEventListener("mouseup", (evt: MouseEvent) => {
                    (node as any)._dragging = false;
                    evt.preventDefault();
                    evt.stopPropagation();
                })),
            RaptorUiUtil.CreateDom("div", null, this.box)
                .SetStyleAttribute("position", "absolute")
                .SetStyleAttribute("cursor", "w-resize")
                .SetStyleAttribute("left", "-2px")
                .SetStyleAttribute("bottom", "0")
                .SetStyleAttribute("top", "0")
                .SetStyleAttribute("width", "4px")
                .Chain((node: RaptorDomBuilder) => node.addEventListener("mousedown", (evt: MouseEvent) => {
                    (node as any)._dragging = true;
                    evt.preventDefault();
                    evt.stopPropagation();
                }))
                .Chain((node: RaptorDomBuilder) => window.addEventListener("mousemove", (evt: MouseEvent) => {
                    if ((node as any)._dragging) {
                        this.handleEvents[2](evt);
                    }
                    evt.preventDefault();
                    evt.stopPropagation();
                }))
                .Chain((node: RaptorDomBuilder) => window.addEventListener("mouseup", (evt: MouseEvent) => {
                    (node as any)._dragging = false;
                    evt.preventDefault();
                    evt.stopPropagation();
                })),
            RaptorUiUtil.CreateDom("div", null, this.box)
                .SetStyleAttribute("position", "absolute")
                .SetStyleAttribute("cursor", "w-resize")
                .SetStyleAttribute("right", "-2px")
                .SetStyleAttribute("bottom", "0")
                .SetStyleAttribute("top", "0")
                .SetStyleAttribute("width", "4px")
                .Chain((node: RaptorDomBuilder) => node.addEventListener("mousedown", (evt: MouseEvent) => {
                    (node as any)._dragging = true;
                    evt.preventDefault();
                    evt.stopPropagation();
                }))
                .Chain((node: RaptorDomBuilder) => window.addEventListener("mousemove", (evt: MouseEvent) => {
                    if ((node as any)._dragging) {
                        this.handleEvents[3](evt);
                    }
                    evt.preventDefault();
                    evt.stopPropagation();
                }))
                .Chain((node: RaptorDomBuilder) => window.addEventListener("mouseup", (evt: MouseEvent) => {
                    (node as any)._dragging = false;
                    evt.preventDefault();
                    evt.stopPropagation();
                })),
        ];

        //Apply mode
        this.UpdateMountMode(mode);

        //Add events
        this.header.addEventListener("mousedown", (evt: MouseEvent) => {
            this.view.GrabWindow(this, evt.pageX, evt.pageY);
            evt.preventDefault();
        });
        window.addEventListener("resize", () => {
            this.SendResize();
        });

        //Create ResizeObserver
        this.observer = new ResizeObserver(() => this.SendResize());
        this.observer.observe(this.content);
    }

    view: RaptorWindowView;
    settings: IRaptorWindow;

    private handleEvents: ((evt: MouseEvent) => void)[];
    private width: number = 100;
    private height: number = 100;
    private mountMode: RaptorWindowMounting;
    private observer: ResizeObserver;

    box: HTMLElement;
    handles: HTMLElement[];
    grabview: HTMLElement;
    header: HTMLElement;
    content: HTMLElement;

    UpdateMountMode(mode: RaptorWindowMounting) {
        //Set
        this.mountMode = mode;

        //Apply
        switch (mode) {
            case RaptorWindowMounting.Center:
                this.ToggleHandles(false, false, false, false);
                this.handleEvents[0] = (evt: MouseEvent) => { };
                this.handleEvents[1] = (evt: MouseEvent) => { };
                this.handleEvents[2] = (evt: MouseEvent) => { };
                this.handleEvents[3] = (evt: MouseEvent) => { };
                break;
            case RaptorWindowMounting.Bottom:
                this.ToggleHandles(true, false, false, false);
                this.handleEvents[0] = (evt: MouseEvent) => { this.UpdateSize(this.width, this.height - evt.movementY); };
                this.handleEvents[1] = (evt: MouseEvent) => { };
                this.handleEvents[2] = (evt: MouseEvent) => { };
                this.handleEvents[3] = (evt: MouseEvent) => { };
                this.UpdateSize(this.width, this.height);
                break;
            case RaptorWindowMounting.Top:
                this.ToggleHandles(false, true, false, false);
                this.handleEvents[0] = (evt: MouseEvent) => { };
                this.handleEvents[1] = (evt: MouseEvent) => { this.UpdateSize(this.width, this.height + evt.movementY); };
                this.handleEvents[2] = (evt: MouseEvent) => { };
                this.handleEvents[3] = (evt: MouseEvent) => { };
                this.UpdateSize(this.width, this.height);
                break;
            case RaptorWindowMounting.Floating:
                this.ToggleHandles(true, true, true, true);
                this.handleEvents[0] = (evt: MouseEvent) => {
                    var delta = Math.max(this.settings.GetMinSize().y, Math.min(this.settings.GetMaxSize().y, this.height - evt.movementY)) - this.height;
                    this.box.style.top = (this.box.getBoundingClientRect().y - delta) + "px";
                    this.UpdateSize(this.width, this.height + delta);
                };
                this.handleEvents[1] = (evt: MouseEvent) => { this.UpdateSize(this.width, this.height + evt.movementY); };
                this.handleEvents[2] = (evt: MouseEvent) => {
                    var delta = Math.max(this.settings.GetMinSize().x, Math.min(this.settings.GetMaxSize().x, this.width - evt.movementX)) - this.width;
                    this.box.style.left = (this.box.getBoundingClientRect().x - delta) + "px";
                    this.UpdateSize(this.width + delta, this.height);
                };
                this.handleEvents[3] = (evt: MouseEvent) => { this.UpdateSize(this.width + evt.movementX, this.height); };
                this.UpdateSize(this.width, this.height);
                break;
        }

        //Reset
        this.UpdateSize(this.width, this.height);
    }

    private SendResize() {
        if (this.settings.ResizeWindow == null) { return; } //backawards-compatible
        this.settings.ResizeWindow(this.content.clientWidth, this.content.clientHeight);
    }

    private ToggleHandles(top: boolean, bottom: boolean, left: boolean, right: boolean) {
        this.handles[0].style.display = top ? "block" : "none";
        this.handles[1].style.display = bottom ? "block" : "none";
        this.handles[2].style.display = left ? "block" : "none";
        this.handles[3].style.display = right ? "block" : "none";
    }

    private UpdateSize(width: number, height: number) {
        //Constrain
        width = Math.max(this.settings.GetMinSize().x, width);
        width = Math.min(this.settings.GetMaxSize().x, width);
        height = Math.max(this.settings.GetMinSize().y, height);
        height = Math.min(this.settings.GetMaxSize().y, height);

        //Update here
        this.width = width;
        this.height = height;

        //Update DOM
        if (this.mountMode == RaptorWindowMounting.Floating) {
            this.box.style.width = width + "px";
        } else {
            this.box.style.width = null;
        }
        this.box.style.height = height + "px";

        //Send
        this.SendResize();
    }

}