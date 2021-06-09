import IRaptorWindow from "RaptorSdk/ui/core/IRaptorWindow";
import { RaptorWindowMounting } from "RaptorSdk/ui/core/RaptorWindowMounting";
import RaptorSize from "RaptorSdk/ui/RaptorSize";
import RaptorUiUtil from "../../RaptorUiUtil";
import RaptorWindowContainer from "./RaptorWindowContainer";

require("./window.css");

export default class RaptorWindowTab {

    constructor(mount: HTMLElement) {
        //Create mounts
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_window_tab", mount);
        this.mountTop = RaptorUiUtil.CreateDom("div", "rsys_window_mount_top", this.mount);
        this.mountCenter = RaptorUiUtil.CreateDom("div", "rsys_window_mount_center", this.mount);
        this.mountBottom = RaptorUiUtil.CreateDom("div", "rsys_window_mount_bottom", this.mount);

        //Add events
        window.addEventListener("mousemove", (evt: MouseEvent) => {
            if (this.grabbing) {
                this.MoveGrabbedObject(evt.pageX, evt.pageY);
                evt.preventDefault();
            }
        });
        window.addEventListener("mouseup", (evt: MouseEvent) => {
            if (this.grabbing) {
                this.DropWindow();
                evt.preventDefault();
            }
        });

        //Initialize docks
        this.RefreshAllDockingPoints();
    }

    private mount: HTMLElement;
    private mountTop: HTMLElement;
    private mountCenter: HTMLElement;
    private mountBottom: HTMLElement;

    private grabbing: boolean;
    private grabbedWindow: RaptorWindowContainer;
    private grabbingHoverDock: HTMLElement;

    AddWindow(settings: IRaptorWindow, mounting: RaptorWindowMounting, mountPriority: number): RaptorWindowContainer {
        //Create
        var e = new RaptorWindowContainer(this, settings, mounting);

        //Mount to needed location
        switch (mounting) {
            case RaptorWindowMounting.Floating: this.mount.appendChild(e.box); break;
            case RaptorWindowMounting.Top: this.mountTop.appendChild(e.box); break;
            case RaptorWindowMounting.Center: this.mountCenter.appendChild(e.box); break;
            case RaptorWindowMounting.Bottom: this.mountBottom.appendChild(e.box); break;
        }

        return e;
    }

    GrabWindow(window: RaptorWindowContainer, x: number, y: number) {
        //If already grabbing, ignore
        if (this.grabbing) {
            return false;
        }

        //Update locally
        this.grabbing = true;
        this.grabbedWindow = window;

        //Update DOM
        this.mount.classList.add("rsys_window_grabbing");
        window.box.classList.add("rsys_window_win_grabbed");
        this.mount.appendChild(window.box);

        //Reset object
        this.grabbedWindow.box.classList.remove("rsys_window_win_floating");
        this.grabbedWindow.box.style.width = null;
        this.grabbedWindow.box.style.height = null;
        this.MoveGrabbedObject(x, y);

        //Make sure we have docking points
        this.RefreshAllDockingPoints();
    }

    DropWindow() {
        //Change all settings
        this.mount.classList.remove("rsys_window_grabbing");

        //Reset
        this.grabbedWindow.box.classList.remove("rsys_window_win_grabbed");
        this.grabbing = false;

        //Depending on if we drop it on a dock or not, decide
        if (this.grabbingHoverDock == null || this.grabbingHoverDock.parentElement == null) {
            //Make floating
            this.grabbedWindow.box.classList.add("rsys_window_win_floating");
            this.grabbedWindow.UpdateMountMode(RaptorWindowMounting.Floating);
        } else {
            console.log(this.grabbingHoverDock);
            //Set the mode
            if (this.grabbingHoverDock.parentElement.classList.contains("rsys_window_mount_top")) {
                this.grabbedWindow.UpdateMountMode(RaptorWindowMounting.Top);
            } else if (this.grabbingHoverDock.parentElement.classList.contains("rsys_window_mount_center")) {
                this.grabbedWindow.UpdateMountMode(RaptorWindowMounting.Center);
            } else if (this.grabbingHoverDock.parentElement.classList.contains("rsys_window_mount_bottom")) {
                this.grabbedWindow.UpdateMountMode(RaptorWindowMounting.Bottom);
            } else {
                throw new Error("Unknown dock type!");
            }

            //Clear position
            this.grabbedWindow.box.style.left = null;
            this.grabbedWindow.box.style.top = null;

            //Move
            this.grabbingHoverDock.parentElement.insertBefore(this.grabbedWindow.box, this.grabbingHoverDock);
            this.grabbingHoverDock.remove(); //makes a nicer animation
        }

        //Refresh docks
        this.RefreshAllDockingPoints();
    }

    private MoveGrabbedObject(x: number, y: number) {
        this.grabbedWindow.box.style.left = (x - 150) + "px";
        this.grabbedWindow.box.style.top = (y - 30) + "px";
    }

    private CreateDockingPoint(classname: string): HTMLElement {
        var e = RaptorUiUtil.CreateDom("div", "rsys_window_dock");
        e.classList.add(classname);
        e.addEventListener("mouseover", (evt: MouseEvent) => {
            if (this.grabbing) {
                this.grabbingHoverDock = evt.currentTarget as HTMLElement;
            }
        });
        e.addEventListener("mouseout", (evt: MouseEvent) => {
            if (this.grabbing && this.grabbingHoverDock == evt.currentTarget) {
                this.grabbingHoverDock = null;
            }
        });
        return e;
    }

    private CreateEdgeDockingPoint(): HTMLElement {
        var e = this.CreateDockingPoint("rsys_window_dock_edge");
        RaptorUiUtil.CreateDom("div", "rsys_window_dock_edge_flipper", e)
            .SetStyleAttribute("top", "-20px");
        RaptorUiUtil.CreateDom("div", "rsys_window_dock_edge_flipper", e)
            .SetStyleAttribute("bottom", "-20px");
        return e;
    }

    private RefreshAllDockingPoints() {
        //Refresh edges
        this.RefreshEdgeDockingPoint(this.mountTop);
        this.RefreshEdgeDockingPoint(this.mountBottom);

        //Make sure the center one has a dock
        if (this.mountCenter.children.length == 0) {
            //Add
            this.mountCenter.appendChild(this.CreateDockingPoint("rsys_window_dock_center"));
        }
        if (this.mountCenter.children.length == 2) {
            //Remove the existing mount. Assume it's at index 0
            this.mountCenter.children[0].remove();
        }
    }

    private RefreshEdgeDockingPoint(mount: HTMLElement) {
        //Ensure that the docking points are every-other-element in this
        for (var i = 0; i < mount.children.length; i++) {
            if (i % 2 == 0 && !mount.children[i].classList.contains("rsys_window_dock")) {
                //Missing, insert it
                mount.insertBefore(this.CreateEdgeDockingPoint(), mount.children[i]);
            }
            if (i % 2 == 1 && mount.children[i].classList.contains("rsys_window_dock")) {
                //Too many, remove
                mount.children[i].remove();
                i--;
            }
        }

        //Check last one as well
        if (mount.children.length == 0 || !(mount.lastChild as HTMLElement).classList.contains("rsys_window_dock")) {
            //Missing, insert it
            mount.appendChild(this.CreateEdgeDockingPoint());
        }
    }

}