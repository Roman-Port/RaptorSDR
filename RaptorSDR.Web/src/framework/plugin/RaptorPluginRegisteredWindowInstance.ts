import IRaptorPluginRegisteredWindowInstance from "RaptorSdk/plugin/IRaptorPluginRegisteredWindowInstance";
import IRaptorWindow from "RaptorSdk/ui/core/IRaptorWindow";
import { RaptorWindowMounting } from "RaptorSdk/ui/core/RaptorWindowMounting";
import RaptorApp from "../../RaptorApp";
import RaptorPluginRegisteredWindow from "./RaptorPluginRegisteredWindow";

export default class RaptorPluginRegisteredWindowInstance implements IRaptorPluginRegisteredWindowInstance {

    constructor(window: RaptorPluginRegisteredWindow, info: any) {
        this.window = window;
        this.info = info;
    }

    window: RaptorPluginRegisteredWindow;
    info: any;

    RequestMount(location: RaptorWindowMounting, priority: number): IRaptorPluginRegisteredWindowInstance {
        //Create the window
        var win = this.window.create(this.info);

        //Add
        this.window.app.uiBody.AddWindow(win, location, priority);

        return this;
    }

}