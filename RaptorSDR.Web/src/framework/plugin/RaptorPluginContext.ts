import IRaptorConnection from 'raptorsdr.web.common/src/IRaptorConnection';
import IRaptorPluginContext from 'raptorsdr.web.common/src/plugin/IRaptorPluginContext';
import IRaptorPlugin from 'raptorsdr.web.common/src/plugin/IRaptorPlugin';
import RaptorMenuBuilder from 'raptorsdr.web.common/src/ui/menu/RaptorMenuBuilder';
import RaptorInfoPlugin from '../web/entities/info/RaptorInfoPlugin';
import RaptorPluginPackage from './RaptorPluginPackage';
import IRaptorPluginPackage from 'raptorsdr.web.common/src/plugin/IRaptorPluginPackage';

export default class RaptorPluginContext implements IRaptorPluginContext {

    constructor(info: RaptorInfoPlugin, conn: IRaptorConnection) {
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
        throw new Error('Method not implemented.');
    }

    info: RaptorInfoPlugin;
    conn: IRaptorConnection;
    private packages: RaptorPluginPackage[];
    private scripts: IRaptorPlugin[];

    ShowMenu(menu: RaptorMenuBuilder): void {
        throw new Error("Method not implemented.");
    }

    AddPackage(pack: RaptorPluginPackage) {
        this.packages.push(pack);
    }

    private static InstantiatePluginScript(pack: RaptorPluginPackage, name: string): IRaptorPlugin {
        var f = new Function('"use strict";' + pack.GetFileAsString(name) + ';return RaptorPlugin;')();
        return new f(this);
    }

    //Creates the scripts
    Instantiate() {
        for (var i = 0; i < this.packages.length; i++) {
            var s = RaptorPluginContext.InstantiatePluginScript(this.packages[i], "index.js");
            this.scripts.push(s);
        }
    }

    //Inits the scripts after Instantiate
    Init() {
        for (var i = 0; i < this.scripts.length; i++) {
            this.scripts[i].Init();
        }
    }

}