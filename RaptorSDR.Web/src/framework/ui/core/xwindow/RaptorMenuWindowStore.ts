import IRaptorWindowClassInfo from "../../../../../sdk/plugin/window/IRaptorWindowClassInfo";
import IRaptorWindowInstanceInfo from "../../../../../sdk/plugin/window/IRaptorWindowInstanceInfo";
import { RaptorLogLevel } from "../../../../../sdk/RaptorLogLevel";
import RaptorApp from "../../../../RaptorApp";
import RaptorPluginRegisteredWindow from "../../../plugin/RaptorPluginRegisteredWindow";
import RaptorPluginRegisteredWindowInstance from "../../../plugin/RaptorPluginRegisteredWindowInstance";
import RaptorPluginRegisteredWindowInstanceMount from "../../../plugin/RaptorPluginRegisteredWindowInstanceMount";
import RaptorInfoPlugin from "../../../web/entities/info/RaptorInfoPlugin";

export default class RaptorMenuWindowStore {

    constructor(app: RaptorApp) {
        this.app = app;
    }

    private app: RaptorApp;
    private registeredClasses: RaptorPluginRegisteredWindow[] = [];
    private registeredInstances: RaptorPluginRegisteredWindowInstance[] = [];
    private instanceMap: { [id: string]: RaptorPluginRegisteredWindowInstance } = {};

    RegisterClass(plugin: RaptorInfoPlugin, info: IRaptorWindowClassInfo): RaptorPluginRegisteredWindow {
        var e = new RaptorPluginRegisteredWindow(this.app, info, plugin);
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

    GetInstancesByPlugin(): RaptorPluginRegisteredWindowInstance[][] {
        var plugins: RaptorPluginRegisteredWindowInstance[][] = [];
        var pluginMap: { [key: string]: RaptorPluginRegisteredWindowInstance[] } = {};
        for (var i = 0; i < this.registeredInstances.length; i++) {
            //Gather info
            var data = this.registeredInstances[i];
            var plugin = data.windowClass.plugin.id;

            //Create array if needed
            if (pluginMap[plugin] == null) {
                pluginMap[plugin] = [];
                plugins.push(pluginMap[plugin]);
            }

            //Add it
            pluginMap[plugin].push(data);
        }
        return plugins;
    }

    static GetInstanceId(instance: RaptorPluginRegisteredWindowInstance): string {
        return instance.windowClass.info.id + "." + instance.info.id;
    }

}