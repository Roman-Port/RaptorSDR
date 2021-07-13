import IRaptorConnection from "RaptorSdk/IRaptorConnection";
import RaptorWebError from "../../../../../sdk/errors/RaptorWebError";
import IRaptorPluginAudio from "../../../../../sdk/plugin/components/IRaptorPluginAudio";
import IRaptorMenu from "../../../../../sdk/ui/menu/IRaptorMenu";
import RaptorMenuBuilder from "../../../../../sdk/ui/menu/RaptorMenuBuilder";
import RaptorPanelBuilder from "../../../../../sdk/ui/panel/RaptorPanelBuilder";
import RaptorMenuUtil from "../../../../../sdk/util/RaptorMenuUtil";
import RaptorUiUtil from "../../../../../sdk/util/RaptorUiUtil";
import IRaptorPrimitiveDataProvider from "../../../../../sdk/web/providers/IRaptorPrimitiveDataProvider";
import RaptorConnection from "../../../RaptorConnection";
import AdvancedSettingsDialog from "../../advancedsettings/AdvancedSettingsDialog";
import RaptorHeaderButtonBuilder from "./button/RaptorHeaderButtonBuilder";
import RaptorHeaderButtonSheet from "./button/RaptorHeaderButtonSheet";
import RaptorSystemTuner from "./freq/RaptorSystemTuner";
import SystemHeaderStatusIcon from "./status/SystemHeaderStatusIcon";
import SystemHeaderStatusIconNetwork from "./status/SystemHeaderStatusIconNetwork";

require("./header.css");
require("./buttons.css");

export default class RaptorSystemHeader {

    constructor(mainMount: HTMLElement, sidebarMount: HTMLElement, conn: RaptorConnection) {
        //Configure
        this.conn = conn;

        //Create the "main" header which is the one across all views
        this.mainView = RaptorUiUtil.CreateDom("div", "rsys_header", mainMount)
            .AddClass("rsys_header_main");

        //Create the "side view" which is on the sidebar
        this.sideView = RaptorUiUtil.CreateDom("div", "rsys_header", sidebarMount);
    }

    Populate() {
        //Make buttons
        this.sheet = new RaptorHeaderButtonSheet(this.sideView);
        new RaptorHeaderButtonBuilder("rsys_header_btn_play")
            .MakeAccent()
            .MakeSelectable("rsys_header_btn_stop", "rsys_header_btn_play", false)
            .BindToDataProvider<boolean>(this.conn.Radio.Power, (power: boolean, btn: RaptorHeaderButtonBuilder) => {
                btn.SetSelected(power);
                btn.SetLoading(false);
            })
            .AddOnClick((btn: RaptorHeaderButtonBuilder) => {
                btn.SetLoading(true);
                this.conn.Radio.Power.SetValue(!this.conn.Radio.Power.GetValue()).catch((error: RaptorWebError) => {
                    btn.SetLoading(false);
                    RaptorMenuUtil.ShowErrorMessage(this.conn, error.caption, error.body);
                });
            })
            .Build(this.sheet);
        new RaptorHeaderButtonBuilder("rsys_header_btn_settings")
            .AddOnClick(() => {
                new AdvancedSettingsDialog(this.conn).Show();
            })
            .Build(this.sheet);
        new RaptorHeaderButtonBuilder("rsys_header_btn_customize")
            .AddOnClick(() => {
                this.conn.app.menuManager.EnterEditingMode();
            })
            .Build(this.sheet);
        new RaptorHeaderButtonBuilder("rsys_header_btn_sound")
            .MakeSelectable("rsys_header_btn_sound", "rsys_header_btn_mute", false)
            .AddOnClick(async (btn: RaptorHeaderButtonBuilder) => {
                btn.SetLoading(true);
                if (this.conn.currentAudio == null) {
                    await this.conn.EnableAudio(this.conn.componentsAudio[0]); //TODO: Allow the user to select what audio backend to use
                } else {
                    await this.conn.DisableAudio();
                }
                btn.SetSelected(this.conn.currentAudio != null);
                btn.SetLoading(false);
            })
            .Build(this.sheet);

        //Create volume slider
        var volumeSlider = RaptorUiUtil.CreateDom("input", null, this.sideView) as any as HTMLInputElement;
        volumeSlider.type = "range";
        volumeSlider.max = "100";
        volumeSlider.min = "0";
        volumeSlider.addEventListener("change", () => {
            this.conn.SetAudioVolume(parseFloat(volumeSlider.value) / 100);
        });
        volumeSlider.disabled = this.conn.GetAudioDevice() == null;
        volumeSlider.value = (this.conn.GetAudioVolume() * 100).toString();
        this.conn.OnAudioDeviceChanged.Bind((device: IRaptorPluginAudio) => {
            volumeSlider.disabled = device == null;
        });
        this.conn.OnAudioVolumeChanged.Bind((volume: number) => {
            volumeSlider.value = (volume * 100).toString();
        });

        //Make tuner
        new RaptorSystemTuner(this.mainView, this.conn);

        //Make status indicators
        var statusContainer = RaptorUiUtil.CreateDom("div", "rsys_headerstatus_container", this.mainView);
        this.statusCpu = new SystemHeaderStatusIcon(statusContainer, 0, 10, false, "rsys_headerstatus_icon_cpu", "ms")
            .AddTipText("CPU Usage", "Shows the CPU usage of the server. Calculated by the amount of time <i>not</i> processing samples every second.<br><br>Higher is better.");
        this.statusNet = new SystemHeaderStatusIconNetwork(statusContainer, this.conn)
            .AddTipText("Network Ping", "Shows the network latency between the server and this client.<br><br>Lower is better.");
    }

    private mainView: HTMLElement;
    private sideView: HTMLElement;
    private conn: RaptorConnection;
    private sheet: RaptorHeaderButtonSheet;

    private statusCpu: SystemHeaderStatusIcon;
    private statusNet: SystemHeaderStatusIcon;

}