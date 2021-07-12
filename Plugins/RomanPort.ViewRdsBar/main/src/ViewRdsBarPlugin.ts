import IRaptorPlugin from 'RaptorSdk/plugin/IRaptorPlugin';
import IRaptorPluginContext from 'RaptorSdk/plugin/IRaptorPluginContext';
import IRaptorWindowContext from '../sdk/ui/core/IRaptorWindowContext';
import { RaptorWindowMounting } from '../sdk/ui/core/RaptorWindowMounting';
import RaptorSize from '../sdk/ui/RaptorSize';
import RdsWindow from './RdsWindow';

export default class ViewRdsBarPlugin implements IRaptorPlugin {

    constructor(ctx: IRaptorPluginContext) {
        this.ctx = ctx;
    }

    private ctx: IRaptorPluginContext;

    Init() {
        //Register window
        var win = this.ctx.RegisterWindowClass({
            id: "RomanPort.RdsBarPlugin.RdsBar",
            displayName: "RDS",
            createInstance: (ctx: IRaptorWindowContext) => new RdsWindow(ctx),
            hideHeader: true,
            sizeDefault: new RaptorSize(400, 40),
            sizeMax: new RaptorSize(9999, 40),
            sizeMin: new RaptorSize(100, 40)
        });

        //Register instance
        win.RegisterInstance({
            displayName: "RDS Info Bar",
            info: {},
            id: "rds"
        }).RequestMount(RaptorWindowMounting.Top, 0);
    }

}