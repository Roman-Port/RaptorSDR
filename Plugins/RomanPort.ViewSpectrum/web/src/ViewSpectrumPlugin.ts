import IRaptorPlugin from "RaptorSdk/plugin/IRaptorPlugin";
import IRaptorPluginContext from "RaptorSdk/plugin/IRaptorPluginContext";
import IRaptorWindowContext from "../sdk/ui/core/IRaptorWindowContext";
import { RaptorWindowMounting } from "../sdk/ui/core/RaptorWindowMounting";
import RaptorSize from "../sdk/ui/RaptorSize";
import ISpectrumPersistSettings from "./misc/ISpectrumPersistSettings";
import ISpectrumInfo from "./config/SpectrumInfo";
import SpectrumStream from "./web/SpectrumStream";
import SpectrumWindow from "./SpectrumWindow";
import IRaptorWindowInfo from "../sdk/ui/core/IRaptorWindowInfo";
import SpectrumDummyGenerator from "./misc/SpectrumDummyGenerator";

export default class ViewSpectrumPlugin implements IRaptorPlugin {

    constructor(ctx: IRaptorPluginContext) {
        this.ctx = ctx;
    }

    private ctx: IRaptorPluginContext;
    private static debugModesCache: { [key: string]: boolean } = {};

    Init() {
        //Fetch list of spectrums
        var list = this.ctx.conn.GetPrimitiveDataProvider<ISpectrumInfo[]>(this.ctx.GetId() + ".Spectrums").GetValue();

        //Register windows
        var win = this.ctx.RegisterWindowClass({
            displayName: "Spectrum",
            id: "RomanPort.SpectrumPlugin.Spectrum",
            createInstance: (ctx: IRaptorWindowContext) => new SpectrumWindow(ctx),
            hideHeader: false,
            sizeMin: new RaptorSize(100, 100),
            sizeDefault: new RaptorSize(400, 300),
            sizeMax: new RaptorSize(3840, 99999),
            createDummy: (info: IRaptorWindowInfo) => SpectrumDummyGenerator.GenerateDummy(info)
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

    static CheckDebugOption(key: string): boolean {
        //Check cache
        if (this.debugModesCache[key] == null) {
            //Check window
            var value = (window as any)["RAPTOR_SPECTRUM_DEBUG_" + key];

            //Update
            this.debugModesCache[key] = value != null && value === true;
        }

        return this.debugModesCache[key];
    }

}