import IRaptorPlugin from 'raptorsdr.web.common/src/plugin/IRaptorPlugin';
import IRaptorPluginContext from 'raptorsdr.web.common/src/plugin/IRaptorPluginContext';

export default class {{NAME_PLUGIN}}Plugin implements IRaptorPlugin {

    constructor(ctx: IRaptorPluginContext) {
        this.ctx = ctx;
    }

    private ctx: IRaptorPluginContext;

    Init() {
        //Do most stuff here
    }

}