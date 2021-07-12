import IRaptorPlugin from "RaptorSdk/plugin/IRaptorPlugin";
import IRaptorPluginContext from "RaptorSdk/plugin/IRaptorPluginContext";
import RaptorSettingsRegionBuilder from "../sdk/ui/setting/RaptorSettingsRegionBuilder";
import IRecorderSettings from "./IRecorderSettings";
import RecorderSession from "./RecorderSession";

export default class RecorderPlugin implements IRaptorPlugin {

    constructor(ctx: IRaptorPluginContext) {
        this.ctx = ctx;
    }

    private ctx: IRaptorPluginContext;

    Init() {
        //Get list of recorders
        var settings = this.ctx.conn.GetPrimitiveDataProvider<IRecorderSettings[]>("RaptorSDR.RomanPort.Recorder.RecorderList").GetValue();

        //Create recorders for each
        for (var i = 0; i < settings.length; i++) {
            var e = new RecorderSession(this, this.ctx.conn, settings[i], this.ctx.CreatePluginRpcEndpoint(settings[i].id));
        }
    }

}