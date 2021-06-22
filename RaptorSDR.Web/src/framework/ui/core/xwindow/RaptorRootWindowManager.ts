import { RaptorLogLevel } from "../../../../../sdk/RaptorLogLevel";
import RaptorUtil from "../../../../../sdk/util/RaptorUtil";
import RaptorApp from "../../../../RaptorApp";
import RaptorPluginRegisteredWindowInstanceMount from "../../../plugin/RaptorPluginRegisteredWindowInstanceMount";
import RaptorUiUtil from "../../RaptorUiUtil";
import BaseChildWindowMount from "./BaseChildWindowMount";
import BaseWindowMount from "./BaseWindowMount";
import StripeWindowMount from "./mounts/StripeWindowMount";
import RaptorMenuWindowStore from "./RaptorMenuWindowStore";
import RaptorWindowWrapper from "./RaptorWindowWrapper";
import IWindowSavedInfo from "./serialization/IWindowSavedInfo";
import IWindowSavedRootInfo from "./serialization/IWindowSavedRootInfo";
import { WindowResizeDirection } from "./WindowResizeDirection";

require("./xwindow.css");

export default class RaptorRootWindowManager extends BaseWindowMount {

    constructor(app: RaptorApp) {
        super();
        this.app = app;
        this.store = app.windowStore;

        this.body.classList.add("sys_xwindow_root");
        this.body.classList.add("sys_xwindow_root_nonediting");

        this.stripe = this.AddChild(new StripeWindowMount(this, true));
        this.app.mount.appendChild(this.body);

        //Jank. Keep thrashing until the size of the window is set and we can perform layout
        this.layoutInterval = window.setInterval(() => {
            if (this.GetWidth() != 0 && this.GetHeight() != 0) {
                this.stripe.UpdateLayout(this.GetWidth(), this.GetHeight(), 0, 0, 0, 0);
                clearInterval(this.layoutInterval);
            }
        }, 1);

        //Bind to window resizes
        window.addEventListener("resize", (evt: UIEvent) => {
            this.stripe.UpdateLayout(this.GetWidth(), this.GetHeight(), 0, 0, 0, 0);
        });

        //Bind to window close so that we can save settings before the window unloads
        window.addEventListener("beforeunload", () => {
            this.SaveLayout();
            return null;
        });
    }

    store: RaptorMenuWindowStore;
    app: RaptorApp;

    private stripe: StripeWindowMount;
    private layoutInterval: number;
    private initializedViews: string[] = [];

    GetWidth(): number {
        return this.body.clientWidth;
    }

    GetHeight(): number {
        return this.body.clientHeight;
    }

    ChildResizeAllowed(child: BaseChildWindowMount, direction: WindowResizeDirection): boolean {
        return false; //Never allowed
    }

    ChildResize(child: BaseChildWindowMount, direction: WindowResizeDirection, delta: number): void {
        //Never allowed
    }

    WindowPickedUp() {
        this.body.classList.remove("sys_xwindow_root_nonediting");
    }

    WindowDropped() {
        this.body.classList.add("sys_xwindow_root_nonediting");
    }

    //Spawns the window under the user's current cursor
    CreateWindow(info: IWindowSavedInfo): RaptorWindowWrapper {
        var window = new RaptorWindowWrapper(this, info);
        window.ForcePickUp();
        return window;
    }

    SaveLayout(): any {
        //Create data
        var payload: IWindowSavedRootInfo = {
            initializedViews: this.store.GetAllInstanceIds(),
            version: 1,
            data: this.stripe.SerializeSave()
        };

        //Serialize and write
        window.localStorage.setItem("RAPTOR_WINDOW_LAYOUT", JSON.stringify(payload));
    }

    LoadLayout() {
        //Get from local storage
        var json = window.localStorage.getItem("RAPTOR_WINDOW_LAYOUT");
        if (json == null)
            return;

        //Parse
        var data = JSON.parse(json) as IWindowSavedRootInfo;

        //Load info
        this.initializedViews = data.initializedViews;

        //Load the view data and refresh
        this.stripe.SerializeRestore(data.data);
        this.Refresh();
    }

    Initialize() {
        //Try to load the layout
        try {
            this.LoadLayout();
        } catch (ex) {
            this.app.conn.Log(RaptorLogLevel.ERROR, "RaptorRootWindowManager", "Failed to restore layout: " + ex);
            this.app.conn.dialog.ShowNegativeNotice("Error Restoring Layout", "Unfortunately, the customized layout settings were corrupted. They'll now be reset.\n\nSorry about that.", "Reload").then(() => {
                window.localStorage.removeItem("RAPTOR_WINDOW_LAYOUT");
                window.location.reload();
            });
            return;
        }

        //Apply layout now to refresh
        this.stripe.UpdateLayout(this.GetWidth(), this.GetHeight(), 0, 0, 0, 0);

        //Process requests for interfaces that haven't already been set up
        this.store.LoopInstanceRequests((request: RaptorPluginRegisteredWindowInstanceMount) => {
            //Check if this has already been given a "shot" at being added
            var id = RaptorMenuWindowStore.GetInstanceId(request.instance);
            if (this.initializedViews.includes(id)) {
                return;
            }

            //Create the window to add
            var window = new RaptorWindowWrapper(this, {
                className: request.instance.windowClass.info.id,
                instanceName: id,
                userPersist: {}
            });

            //Add it to the window
            this.stripe.AddWindow(window, request.location);
        });

        //Apply layout now to refresh
        this.stripe.UpdateLayout(this.GetWidth(), this.GetHeight(), 0, 0, 0, 0);

        //test
        //this.EnterEditingMode();
    }

    EnterEditingMode() {
        this.body.classList.add("sys_xwindow_editing");
    }

    LeaveEditingMode() {
        this.body.classList.remove("sys_xwindow_editing");
    }

}