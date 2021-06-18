import IRaptorConnection from "RaptorSdk/IRaptorConnection";
import RaptorWebError from "../../../../../sdk/errors/RaptorWebError";
import IRaptorMenu from "../../../../../sdk/ui/menu/IRaptorMenu";
import RaptorMenuBuilder from "../../../../../sdk/ui/menu/RaptorMenuBuilder";
import RaptorPanelBuilder from "../../../../../sdk/ui/panel/RaptorPanelBuilder";
import RaptorMenuUtil from "../../../../../sdk/util/RaptorMenuUtil";
import IRaptorPrimitiveDataProvider from "../../../../../sdk/web/providers/IRaptorPrimitiveDataProvider";
import RaptorConnection from "../../../RaptorConnection";
import RaptorUiUtil from "../../RaptorUiUtil";
import RaptorSystemTuner from "./freq/RaptorSystemTuner";
import SystemHeaderStatusIcon from "./status/SystemHeaderStatusIcon";
import SystemHeaderStatusIconNetwork from "./status/SystemHeaderStatusIconNetwork";

require("./header.css");
require("./buttons.css");

export default class RaptorSystemHeader {

    constructor(mount: HTMLElement, conn: RaptorConnection) {
        //Configure
        this.conn = conn;

        //Create
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_header", mount);
    }

    Populate() {
        //Make buttons
        new SystemHeaderButtonBuilder("rsys_header_btn_play")
            .MakeAccent()
            .MakeDropdown()
            .MakeSelectable("rsys_header_btn_stop", "rsys_header_btn_play", false)
            .BindToDataProvider<boolean>(this.conn.Radio.Power, (power: boolean, btn: SystemHeaderButtonBuilder) => {
                btn.SetSelected(power);
                btn.SetLoading(false);
            })
            .AddOnClick((btn: SystemHeaderButtonBuilder) => {
                btn.SetLoading(true);
                this.conn.Radio.Power.SetValue(!this.conn.Radio.Power.GetValue()).catch((error: RaptorWebError) => {
                    btn.SetLoading(false);
                    RaptorMenuUtil.ShowErrorMessage(this.conn, error.caption, error.body);
                });
            })
            .Build(this.mount);
        new SystemHeaderButtonBuilder("rsys_header_btn_sound")
            .MakeSelectable("rsys_header_btn_sound", "rsys_header_btn_mute", false)
            .AddOnClick(async (btn: SystemHeaderButtonBuilder) => {
                btn.SetLoading(true);
                if (this.conn.currentAudio == null) {
                    await this.conn.EnableAudio(this.conn.componentsAudio[0]); //TODO: Allow the user to select what audio backend to use
                } else {
                    await this.conn.DisableAudio();
                }
                btn.SetSelected(this.conn.currentAudio != null);
                btn.SetLoading(false);
            })
            .Build(this.mount);
        new SystemHeaderButtonBuilder("rsys_header_btn_logout")
            .AddOnClick(() => {
                this.conn.dialog.ShowYesNoDialogNegative("Log Out", "Are you sure you want to sign out of RaptorSDR?", "Log Out").then((value: boolean) => {
                    if (value) {
                        localStorage.setItem("RAPTOR_REFRESH_TOKEN", null);
                        window.location.reload();
                    }
                });
            })
            .Build(this.mount);

        //Make tuner
        new RaptorSystemTuner(this.mount, this.conn);

        //Make status indicators
        var statusContainer = RaptorUiUtil.CreateDom("div", "rsys_headerstatus_container", this.mount);
        this.statusCpu = new SystemHeaderStatusIcon(statusContainer, 0, 10, false, "rsys_headerstatus_icon_cpu", "ms")
            .AddTipText("CPU Usage", "Shows the CPU usage of the server. Calculated by the amount of time <i>not</i> processing samples every second.<br><br>Higher is better.");
        this.statusNet = new SystemHeaderStatusIconNetwork(statusContainer, this.conn)
            .AddTipText("Network Ping", "Shows the network latency between the server and this client.<br><br>Lower is better.");
    }

    private mount: HTMLElement;
    private conn: RaptorConnection;

    private statusCpu: SystemHeaderStatusIcon;
    private statusNet: SystemHeaderStatusIcon;

}

class SystemHeaderButtonBuilder {

    constructor(classname: string) {
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_header_button", null);
        this.clicker = RaptorUiUtil.CreateDom("div", "rsys_header_button_clicker", this.mount);
        this.mount.classList.add(classname);
    }

    mount: HTMLElement;
    clicker: HTMLElement;

    private selectedClass: string;
    private unselectedClass: string;

    MakeAccent(): SystemHeaderButtonBuilder {
        this.mount.classList.add("rsys_header_button_accent");
        return this;
    }

    MakeDropdown(): SystemHeaderButtonBuilder {
        var dropdown = RaptorUiUtil.CreateDom("div", "rsys_header_button_dropdown", this.mount);
        RaptorUiUtil.CreateDom("div", "rsys_header_button_dropdown_option", dropdown);
        RaptorUiUtil.CreateDom("div", "rsys_header_button_dropdown_option", dropdown);
        RaptorUiUtil.CreateDom("div", "rsys_header_button_dropdown_option", dropdown);
        return this;
    }

    MakeSelectable(selectedClass: string, unselectedClass: string, defaultSelection: boolean): SystemHeaderButtonBuilder {
        this.selectedClass = selectedClass;
        this.unselectedClass = unselectedClass
        return this.SetSelected(defaultSelection);
    }

    AddOnClick(callback: (btn: SystemHeaderButtonBuilder) => void): SystemHeaderButtonBuilder {
        this.clicker.addEventListener("click", () => callback(this));
        return this;
    }

    BindToDataProvider<T>(provider: IRaptorPrimitiveDataProvider<T>, updatedCallback: (value: T, btn: SystemHeaderButtonBuilder) => void): SystemHeaderButtonBuilder {
        provider.OnChanged.Bind((value: T) => {
            updatedCallback(value, this);
        });
        return this;
    }

    SetLoading(loading: boolean): SystemHeaderButtonBuilder {
        if (loading) {
            this.clicker.classList.add("loading_btn");
        } else {
            this.clicker.classList.remove("loading_btn");
        }
        return this;
    }

    SetSelected(selected: boolean): SystemHeaderButtonBuilder {
        if (selected) {
            this.mount.classList.add(this.selectedClass);
            this.mount.classList.remove(this.unselectedClass);
        } else {
            this.mount.classList.remove(this.selectedClass);
            this.mount.classList.add(this.unselectedClass);
        }
        return this;
    }

    Build(container: HTMLElement) {
        container.appendChild(this.mount);
    }

}