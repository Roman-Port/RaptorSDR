import IRaptorPlugin from "RaptorSdk/plugin/IRaptorPlugin";
import IRaptorPluginContext from "RaptorSdk/plugin/IRaptorPluginContext";

export default class {{NAME_PLUGIN}}Plugin implements IRaptorPlugin {

    constructor(ctx: IRaptorPluginContext) {
        this.ctx = ctx;
    }

    private ctx: IRaptorPluginContext;

    Init() {
        //Do most stuff here
    }

}