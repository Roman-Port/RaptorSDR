import IRaptorWindowClassInfo from "../../../../../sdk/plugin/window/IRaptorWindowClassInfo";
import IRaptorWindowInstanceInfo from "../../../../../sdk/plugin/window/IRaptorWindowInstanceInfo";
import { RaptorLogLevel } from "../../../../../sdk/RaptorLogLevel";
import RaptorApp from "../../../../RaptorApp";
import RaptorPluginRegisteredWindow from "../../../plugin/RaptorPluginRegisteredWindow";
import RaptorPluginRegisteredWindowInstance from "../../../plugin/RaptorPluginRegisteredWindowInstance";
import RaptorPluginRegisteredWindowInstanceMount from "../../../plugin/RaptorPluginRegisteredWindowInstanceMount";

export default class RaptorMenuWindowStore {

    constructor(app: RaptorApp) {
        this.app = app;
    }

    private app: RaptorApp;
    private registeredClasses: RaptorPluginRegisteredWindow[] = [];
    private registeredInstances: RaptorPluginRegisteredWindowInstance[] = [];
    private instanceMap: { [id: string]: RaptorPluginRegisteredWindowInstance } = {};

    RegisterClass(info: IRaptorWindowClassInfo): RaptorPluginRegisteredWindow {
        var e = new RaptorPluginRegisteredWindow(this.app, info);
        this.registeredClasses.push(e);
        this.app.conn.Log(RaptorLogLevel.DEBUG, "RaptorMenuWindowStore", "Registered window class \"" + e.GetName() + "\".");
        return e;
    }

    RegisterInstance(window: RaptorPluginRegisteredWindow, info: IRaptorWindowInstanceInfo): RaptorPluginRegisteredWindowInstance {
        var e = new RaptorPluginRegisteredWindowInstance(window, info);
        this.registeredInstances.push(e);
        this.instanceMap[RaptorMenuWindowStore.GetInstanceId(e)] = e;
        this.app.conn.Log(RaptorLogLevel.DEBUG, "RaptorMenuWindowStore", "Registered window instance \"" + RaptorMenuWindowStore.GetInstanceId(e) + "\".");
        return e;
    }

    GetInstanceById(id: string): RaptorPluginRegisteredWindowInstance {
        return this.instanceMap[id];
    }

    GetAllInstanceIds(): string[] {
        var s = [];
        for (var i = 0; i < this.registeredInstances.length; i++)
            s.push(RaptorMenuWindowStore.GetInstanceId(this.registeredInstances[i]));
        return s;
    }

    LoopInstanceRequests(callback: (request: RaptorPluginRegisteredWindowInstanceMount) => void): void {
        for (var i = 0; i < this.registeredInstances.length; i++) {
            for (var j = 0; j < this.registeredInstances[i].requests.length; j++)
                callback(this.registeredInstances[i].requests[j]);
        }
    }

    static GetInstanceId(instance: RaptorPluginRegisteredWindowInstance): string {
        return instance.windowClass.info.id + "." + instance.info.displayName;
    }

}