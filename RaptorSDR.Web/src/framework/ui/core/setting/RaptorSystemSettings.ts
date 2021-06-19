import RaptorSettingsRegionBuilder from "../../../../../sdk/ui/setting/RaptorSettingsRegionBuilder";
import { RaptorSettingsTab } from "../../../../../sdk/ui/setting/RaptorSettingsTab";
import IRaptorSelectableDataProvider from "../../../../../sdk/web/providers/IRaptorSelectableDataProvider";
import RaptorApp from "../../../../RaptorApp";

export default class RaptorSystemSettings {

    static CreateSystemSettings(app: RaptorApp) {
        //Init
        var store = app.settingStore;
        var conn = app.conn;

        //MANY OF THESE ARE PLACEHOLDERS

        //Radio settings
        var radioSettings = new RaptorSettingsRegionBuilder("Radio Settings", "sys-radio", conn)
            .AddOptionNumber("Bandwidth", conn.VFO.Bandwidth, 1000, 500000)
            .AddOptionSelect("Demodulator", conn.VFO.Demodulator, this.CreateOptionsFromSelectableDataProvider(conn.VFO.Demodulator))
            .AddOptionSelect("Source", conn.Radio.Source, this.CreateOptionsFromSelectableDataProvider(conn.Radio.Source))
            .Build();
        store.RegisterSidebarRegion(radioSettings, RaptorSettingsTab.GENRAL);

        //Demodulator settings
        var demodSettings = new RaptorSettingsRegionBuilder("Demod Settings", "sys-demod", conn)
            .AddOptionBoolean("Stereo", conn.GetPrimitiveDataProvider<boolean>("RaptorSDR.RomanPort.DemodulatorWbFm.WbFm.StereoEnabled"), "On", "Off")
            .AddOptionBoolean("Region", conn.GetPrimitiveDataProvider<boolean>("RaptorSDR.RomanPort.DemodulatorWbFm.WbFm.StereoEnabled"), "US", "Other")
            .Build();
        store.RegisterSidebarRegion(demodSettings, RaptorSettingsTab.GENRAL);

        //Source settings
        var sourceSettings = new RaptorSettingsRegionBuilder("Source Settings", "sys-source", conn)
            .AddOptionFileOpen("IQ File", conn.GetPrimitiveDataProvider<string>("RaptorSDR.RomanPort.SourceFile.Source.FileLocation"), "Choose IQ File")
            .Build();
        store.RegisterSidebarRegion(sourceSettings, RaptorSettingsTab.GENRAL);
    }

    private static CreateOptionsFromSelectableDataProvider(dp: IRaptorSelectableDataProvider): { [displayName: string]: string } {
        var e: { [displayName: string]: string } = {};
        var options = dp.GetOptions();
        for (var i = 0; i < options.length; i++)
            e[options[i]] = options[i]; //todo: Make user display name
        return e;
    }

}