import IRaptorPluginRegisteredWindow from "RaptorSdk/plugin/IRaptorPluginRegisteredWindow";
import IRaptorPluginRegisteredWindowInstance from "RaptorSdk/plugin/IRaptorPluginRegisteredWindowInstance";
import IRaptorWindow from "RaptorSdk/ui/core/IRaptorWindow";
import RaptorApp from "../../RaptorApp";
import RaptorPluginRegisteredWindowInstance from "./RaptorPluginRegisteredWindowInstance";

export default class RaptorPluginRegisteredWindow implements IRaptorPluginRegisteredWindow {

    constructor(app: RaptorApp, name: string, create: (info: any) => IRaptorWindow) {
        this.app = app;
        this.name = name;
        this.create = create;
    }

    app: RaptorApp;
    name: string;
    create: (info: any) => IRaptorWindow;

    GetName(): string {
        return this.name;
    }

    CreateInstance(name: string, info: any): IRaptorPluginRegisteredWindowInstance {
        return new RaptorPluginRegisteredWindowInstance(this, info);
    }

}