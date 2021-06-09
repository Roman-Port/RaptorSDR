import IRaptorPlugin from "RaptorSdk/plugin/IRaptorPlugin";
import IRaptorPluginContext from "RaptorSdk/plugin/IRaptorPluginContext";
import { RaptorWindowMounting } from "../sdk/ui/core/RaptorWindowMounting";
import SpectrumInfo from "./SpectrumInfo";
import SpectrumStream from "./SpectrumStream";
import SpectrumWindow from "./SpectrumWindow";

export default class ViewSpectrumPlugin implements IRaptorPlugin {

    constructor(ctx: IRaptorPluginContext) {
        this.ctx = ctx;
    }

    private ctx: IRaptorPluginContext;

    Init() {
        //Fetch list of spectrums
        var list = this.ctx.conn.GetPrimitiveDataProvider<SpectrumInfo[]>(this.ctx.GetId() + ".Spectrums").GetValue();

        //Register windows
        var win = this.ctx.RegisterWindowClass("Spectrum", (info: any) => new SpectrumWindow(this.ctx.conn, info as SpectrumInfo));
        for (var i = 0; i < list.length; i++) {
            win.CreateInstance(list[i].name, list[i]).RequestMount(RaptorWindowMounting.Center, 10);
        }
    }

}