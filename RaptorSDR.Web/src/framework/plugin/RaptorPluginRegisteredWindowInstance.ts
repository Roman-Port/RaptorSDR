import IRaptorPluginRegisteredWindowInstance from "RaptorSdk/plugin/IRaptorPluginRegisteredWindowInstance";
import IRaptorWindow from "RaptorSdk/ui/core/IRaptorWindow";
import { RaptorWindowMounting } from "RaptorSdk/ui/core/RaptorWindowMounting";
import IRaptorWindowInstanceInfo from "../../../sdk/plugin/window/IRaptorWindowInstanceInfo";
import RaptorSize from "../../../sdk/ui/RaptorSize";
import RaptorApp from "../../RaptorApp";
import RaptorPluginRegisteredWindow from "./RaptorPluginRegisteredWindow";
import RaptorPluginRegisteredWindowInstanceMount from "./RaptorPluginRegisteredWindowInstanceMount";

export default class RaptorPluginRegisteredWindowInstance implements IRaptorPluginRegisteredWindowInstance {

    constructor(window: RaptorPluginRegisteredWindow, info: IRaptorWindowInstanceInfo) {
        this.windowClass = window;
        this.info = info;
    }

    windowClass: RaptorPluginRegisteredWindow;
    info: IRaptorWindowInstanceInfo;

    requests: RaptorPluginRegisteredWindowInstanceMount[] = [];

    RequestMount(location: RaptorWindowMounting, priority: number): IRaptorPluginRegisteredWindowInstance {
        this.requests.push(new RaptorPluginRegisteredWindowInstanceMount(this, location, priority));
        return this;
    }

    Serialize() {

    }

}