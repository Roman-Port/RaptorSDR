import IRaptorPluginRegisteredWindow from "RaptorSdk/plugin/IRaptorPluginRegisteredWindow";
import IRaptorPluginRegisteredWindowInstance from "RaptorSdk/plugin/IRaptorPluginRegisteredWindowInstance";
import IRaptorWindow from "RaptorSdk/ui/core/IRaptorWindow";
import IRaptorWindowClassInfo from "../../../sdk/plugin/window/IRaptorWindowClassInfo";
import IRaptorWindowInstanceInfo from "../../../sdk/plugin/window/IRaptorWindowInstanceInfo";
import RaptorApp from "../../RaptorApp";
import RaptorPluginRegisteredWindowInstance from "./RaptorPluginRegisteredWindowInstance";

export default class RaptorPluginRegisteredWindow implements IRaptorPluginRegisteredWindow {

    constructor(app: RaptorApp, info: IRaptorWindowClassInfo) {
        this.app = app;
        this.info = info;
    }

    app: RaptorApp;
    info: IRaptorWindowClassInfo;

    GetName(): string {
        return this.info.displayName;
    }

    RegisterInstance(info: IRaptorWindowInstanceInfo): IRaptorPluginRegisteredWindowInstance {
        return this.app.windowStore.RegisterInstance(this, info);
    }

}