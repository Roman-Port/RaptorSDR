import IRaptorPlugin from 'RaptorSdk/plugin/IRaptorPlugin';
import IRaptorPluginContext from 'RaptorSdk/plugin/IRaptorPluginContext';
import { RaptorWindowMounting } from 'RaptorSdk/ui/core/RaptorWindowMounting';
import RdsWindow from './RdsWindow';

export default class ViewRdsBarPlugin implements IRaptorPlugin {

    constructor(ctx: IRaptorPluginContext) {
        this.ctx = ctx;
    }

    private ctx: IRaptorPluginContext;

    Init() {
        //Register window
        console.log(this.ctx);
        var win = this.ctx.RegisterWindowClass("RDS Panel", (info: any) => new RdsWindow(this.ctx.conn, info));

        console.log(win);
        var wini = win.CreateInstance("Main", {});

        console.log(wini);
        wini.RequestMount(RaptorWindowMounting.Top, 0);
    }

}