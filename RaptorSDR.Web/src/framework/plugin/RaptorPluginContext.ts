import IRaptorConnection from 'RaptorSdk/IRaptorConnection';
import IRaptorPluginContext from 'RaptorSdk/plugin/IRaptorPluginContext';
import IRaptorPlugin from 'RaptorSdk/plugin/IRaptorPlugin';
import RaptorMenuBuilder from 'RaptorSdk/ui/menu/RaptorMenuBuilder';
import RaptorInfoPlugin from '../web/entities/info/RaptorInfoPlugin';
import RaptorPluginPackage from './RaptorPluginPackage';
import IRaptorPluginPackage from 'RaptorSdk/plugin/IRaptorPluginPackage';
import IRaptorWindow from 'RaptorSdk/ui/core/IRaptorWindow';
import IRaptorPluginRegisteredWindow from 'RaptorSdk/plugin/IRaptorPluginRegisteredWindow';
import RaptorPluginRegisteredWindow from './RaptorPluginRegisteredWindow';
import RaptorConnection from '../RaptorConnection';
import IRaptorPluginAudio from '../../../sdk/plugin/components/IRaptorPluginAudio';
import IRaptorWindowClassInfo from '../../../sdk/plugin/window/IRaptorWindowClassInfo';

export default class RaptorPluginContext implements IRaptorPluginContext {

    constructor(info: RaptorInfoPlugin, conn: RaptorConnection) {
        this.info = info;
        this.conn = conn;
        this.packages = [];
        this.scripts = [];
    }

    GetPackage(id: string): IRaptorPluginPackage {
        for (var i = 0; i < this.packages.length; i++) {
            if (this.packages[i].GetName() == id) {
                return this.packages[i];
            }
        }
        return null;
    }

    GetName(): string {
        return this.info.plugin_name;
    }

    GetDeveloper(): string {
        return this.info.developer_name;
    }

    GetId(): string {
        return this.info.id;
    }

    info: RaptorInfoPlugin;
    conn: RaptorConnection;
    private packages: RaptorPluginPackage[];
    private scripts: IRaptorPlugin[];

    ShowMenu(menu: RaptorMenuBuilder): void {
        throw new Error("Method not implemented.");
    }

    AddPackage(pack: RaptorPluginPackage) {
        this.packages.push(pack);
    }

    private InstantiatePluginScript(pack: RaptorPluginPackage, name: string): IRaptorPlugin {
        var f = new Function('"use strict";' + pack.GetFileAsString(name) + ';return RaptorPlugin;')();
        return new f(this);
    }

    //Creates the scripts
    Instantiate() {
        for (var i = 0; i < this.packages.length; i++) {
            var s = this.InstantiatePluginScript(this.packages[i], "index.js");
            this.scripts.push(s);
        }
    }

    //Inits the scripts after Instantiate
    Init() {
        for (var i = 0; i < this.scripts.length; i++) {
            this.scripts[i].Init();
        }
    }

    RegisterWindowClass(info: IRaptorWindowClassInfo): IRaptorPluginRegisteredWindow {
        return this.conn.app.windowStore.RegisterClass(info);
    }

    RegisterComponentAudio(audio: IRaptorPluginAudio): void {
        this.conn.RegisterComponentAudio(this, audio);
    }

}