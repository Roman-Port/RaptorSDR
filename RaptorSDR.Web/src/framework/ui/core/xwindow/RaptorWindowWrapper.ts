import IRaptorWindowClassInfo from "../../../../../sdk/plugin/window/IRaptorWindowClassInfo";
import { RaptorLogLevel } from "../../../../../sdk/RaptorLogLevel";
import IRaptorWindow from "../../../../../sdk/ui/core/IRaptorWindow";
import RaptorSize from "../../../../../sdk/ui/RaptorSize";
import RaptorUiUtil from "../../RaptorUiUtil";
import IWindowDropZoneElement from "./misc/IWindowDropZoneElement";
import RaptorWindowContext from "./misc/RaptorWindowContext";
import BaseStripeWindowMount from "./mounts/BaseStripeWindowMount";
import RaptorMenuWindowStore from "./RaptorMenuWindowStore";
import RaptorRootWindowManager from "./RaptorRootWindowManager";
import IWindowSavedInfo from "./serialization/IWindowSavedInfo";

require("./xwindow_wrapper.css");

export default class RaptorWindowWrapper {

    constructor(root: RaptorRootWindowManager, info: IWindowSavedInfo) {
        this.root = root;
        this.info = info;

        //Create body components
        this.body = RaptorUiUtil.CreateDom("div", "sys_xwindow_window")
            .AddClass("sys_xwindowwrap");
        this.cover = RaptorUiUtil.CreateDom("div", "sys_xwindowwrap_component_grabcover", this.body);
        this.header = RaptorUiUtil.CreateDom("div", "sys_xwindowwrap_component_header", this.body);
        this.content = RaptorUiUtil.CreateDom("div", "sys_xwindowwrap_component_content", this.body);

        //Create sub components
        this.headerText = RaptorUiUtil.CreateDom("div", "sys_xwindowwrap_component_header_title", this.header);
        this.AddHeaderButton("sys_xwindowwrap_component_header_btn_close", () => {
            this.CloseWindow();
        });

        //Add dragging events
        RaptorUiUtil.AddDragEvents(this.header, {
            DragBegin: (evt: MouseEvent) => {
                this.PickedUp();
            },
            DragMove: (evt: MouseEvent) => {
                //Move the window
                this.body.style.top = (evt.pageY - (RaptorWindowWrapper.WINDOW_GRABBED_HEIGHT / 2)) + "px";
                this.body.style.left = (evt.pageX - (RaptorWindowWrapper.WINDOW_GRABBED_WIDTH / 2)) + "px";

                //Check if the current item we're hovering over is a drop zone and if it's changed
                var target = evt.target as IWindowDropZoneElement;
                if (target.xraptor_dropzone_dropped == null) {
                    //Left drop zone
                    this.targetDropZone = null;
                    this.body.style.opacity = "0.65";
                } else {
                    //Entered drop zone
                    this.targetDropZone = target;
                    this.body.style.opacity = "1";
                }
            },
            DragEnd: (evt: MouseEvent) => {
                this.PutDown();
            }
        });

        //Initialize window
        this.InitializeWindow();
    }

    private root: RaptorRootWindowManager;
    private info: IWindowSavedInfo;
    private mount: BaseStripeWindowMount;
    private targetDropZone: IWindowDropZoneElement;
    private userWindow: IRaptorWindow;
    private classInfo: IRaptorWindowClassInfo;

    private body: HTMLElement;
    private cover: HTMLElement;
    private header: HTMLElement;
    private content: HTMLElement;

    private headerText: HTMLElement;

    private hasPluginWindowBeenCreated: boolean = false;

    minSize: RaptorSize = new RaptorSize(50, 50);
    defaultSize: RaptorSize = new RaptorSize(50, 50);
    maxSize: RaptorSize = new RaptorSize(99999999, 99999999);

    private static readonly WINDOW_GRABBED_WIDTH: number = 200;
    private static readonly WINDOW_GRABBED_HEIGHT: number = 60;

    ForcePickUp() {
        RaptorUiUtil.ForceBeginDrag(this.body);
    }

    MoveTo(mount: BaseStripeWindowMount, dom: HTMLElement) {
        this.mount = mount;
        dom.appendChild(this.body);
    }

    PickedUp() {
        //Adjust style
        this.body.style.width = RaptorWindowWrapper.WINDOW_GRABBED_WIDTH + "px";
        this.body.style.height = RaptorWindowWrapper.WINDOW_GRABBED_HEIGHT + "px";
        this.body.style.zIndex = "100000";
        this.body.style.pointerEvents = "none";
        this.body.style.right = null;
        this.body.style.bottom = null;
        this.body.classList.add("sys_xwindowwrap_grabbed");

        //Move us to the root document
        document.body.appendChild(this.body);

        //Remove old holder if we have one
        if (this.mount != null) {
            this.mount.RemoveWindow(this);
            this.mount = null;
        }

        //Clear old states just in case
        this.targetDropZone = null;

        //Set state in root
        this.root.WindowPickedUp();
    }

    PutDown() {
        //Check if we're in a drop zone
        if (this.targetDropZone == null) {
            this.DropIntoRemoval();
        } else {
            this.DropIntoDropzone();
        }

        //Update state
        this.root.WindowDropped();
    }

    private DropIntoDropzone() {
        //Reset style
        this.body.style.width = null;
        this.body.style.height = null;
        this.body.style.zIndex = null;
        this.body.style.pointerEvents = null;
        this.body.style.top = "0";
        this.body.style.left = "0";
        this.body.style.right = "0";
        this.body.style.bottom = "0";
        this.body.classList.remove("sys_xwindowwrap_grabbed");

        //Drop into this dropzone
        this.targetDropZone.xraptor_dropzone_dropped(this);
    }

    private DropIntoRemoval() {
        //Play animation
        this.body.classList.add("sys_xwindow_removeanim");

        //Remove shortly
        window.setTimeout(() => {
            this.body.remove();
        }, 300);
    }

    GetSerializedInfo(): IWindowSavedInfo {
        return this.info;
    }

    private InitializeWindow() {
        //Get the instance
        var instance = this.root.store.GetInstanceById(this.info.instanceName);
        if (instance == null) {
            this.ChangeTitle("Unknown Window");
            this.FatalErrorWindow("This view is no longer installed.");
            return;
        } else {
            this.ChangeTitle(instance.info.displayName);
        }

        //Create the window context
        var windowContext = new RaptorWindowContext(this.root.app.conn, RaptorMenuWindowStore.GetInstanceId(instance), instance.info.info, this.info.userPersist);

        //Create the plugin code
        try {
            this.userWindow = instance.windowClass.info.createInstance(windowContext);
        } catch (ex) {
            this.FatalErrorWindow("Failed to create view.");
            this.root.app.conn.Log(RaptorLogLevel.ERROR, "RaptorWindowWrapper", "Plugin error while trying to create window: " + ex);
            return;
        }

        //Configure
        this.classInfo = instance.windowClass.info;
        this.minSize = this.classInfo.sizeMin;
        this.maxSize = this.classInfo.sizeMax;
        this.defaultSize = this.classInfo.sizeDefault;
        if (!this.classInfo.hideHeader)
            this.body.classList.add("sys_xwindowwrap_headerlocked");
    }

    private FatalErrorWindow(text: string) {
        this.content.classList.add("sys_xwindowwrap_error_container");
        var e = RaptorUiUtil.CreateDom("div", "sys_xwindowwrap_error", this.content);
        RaptorUiUtil.CreateDom("div", "sys_xwindowwrap_error_top", e).innerText = text;
        RaptorUiUtil.CreateDom("div", "sys_xwindowwrap_error_bottom", e).innerText = "Click anywhere to remove window.";
        this.content.addEventListener("click", () => {
            this.CloseWindow();
        });
    }

    ChangeSize(width: number, height: number) {
        //Resize
        this.body.style.top = "0";
        this.body.style.left = "0";
        this.body.style.width = width + "px";
        this.body.style.height = height + "px";

        //Subtract header from the height, if any
        if (this.body.classList.contains("sys_xwindowwrap_headerlocked"))
            height -= 40; 

        //Create the plugin window now that it has it's size set
        if (this.userWindow != null && !this.hasPluginWindowBeenCreated) {
            this.userWindow.CreateWindow(this.content);
            this.hasPluginWindowBeenCreated = true;
        }

        if (Number.isNaN(width))
            throw new Error("WIdth is NaN");

        //Update plugin if needed
        if (this.userWindow != null && width != 0 && height != 0)
            this.userWindow.ResizeWindow(width, height);
    }

    ChangeTitle(title: string) {
        this.cover.innerText = title;
        this.headerText.innerText = title;
    }

    AddHeaderButton(className: string, callback: () => void) {
        //Create
        var e = RaptorUiUtil.CreateDom("div", "sys_xwindowwrap_component_header_btn", this.header)
            .AddClass(className);

        //Bind to mousedown to prevent this from triggering a drag
        e.addEventListener("mousedown", (evt: MouseEvent) => {
            evt.stopPropagation();
            evt.preventDefault();
        });

        //Bind actual event
        e.addEventListener("click", (evt: MouseEvent) => {
            evt.stopPropagation();
            evt.preventDefault();
            callback();
        });
    }

    CloseWindow() {
        //Remove old holder if we have one, otherwise just remove ourselves
        if (this.mount != null) {
            this.mount.RemoveWindow(this);
            this.mount = null;
        } else {
            this.body.remove();
        }

        //Update plugin if needed
        if (this.userWindow != null)
            this.userWindow.DestoryWindow();
    }

}