import IRaptorPlugin from "RaptorSdk/plugin/IRaptorPlugin";
import IRaptorPluginContext from "RaptorSdk/plugin/IRaptorPluginContext";
import { RaptorWindowMounting } from "../sdk/ui/core/RaptorWindowMounting";
import RaptorSize from "../sdk/ui/RaptorSize";
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
        var win = this.ctx.RegisterWindowClass({
            displayName: "Spectrum",
            id: "RomanPort.SpectrumPlugin.Spectrum",
            createInstance: (info: any) => new SpectrumWindow(this.ctx.conn, info as SpectrumInfo),
            hideHeader: false,
            sizeMin: new RaptorSize(100, 100),
            sizeDefault: new RaptorSize(400, 300),
            sizeMax: new RaptorSize(3840, 99999)
        });

        //Create all windows we have registered
        for (var i = 0; i < list.length; i++) {
            win.RegisterInstance({
                displayName: list[i].name,
                info: list[i],
                id: list[i].id
            }).RequestMount(RaptorWindowMounting.Center, 10);
        }
    }

}