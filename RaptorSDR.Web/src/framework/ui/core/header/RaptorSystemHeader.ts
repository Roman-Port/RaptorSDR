import IRaptorConnection from "RaptorSdk/IRaptorConnection";
import IRaptorMenu from "../../../../../sdk/ui/menu/IRaptorMenu";
import RaptorMenuBuilder from "../../../../../sdk/ui/menu/RaptorMenuBuilder";
import RaptorPanelBuilder from "../../../../../sdk/ui/panel/RaptorPanelBuilder";
import IRaptorPrimitiveDataProvider from "../../../../../sdk/web/providers/IRaptorPrimitiveDataProvider";
import RaptorUiUtil from "../../RaptorUiUtil";
import RaptorSystemTuner from "./freq/RaptorSystemTuner";

require("./header.css");
require("./buttons.css");

export default class RaptorSystemHeader {

    constructor(mount: HTMLElement, conn: IRaptorConnection) {
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
            .BindToDataProvider<boolean>(this.conn.Radio.Power, (power: boolean, btn: SystemHeaderButtonBuilder) => {
                if (power) {
                    btn.mount.classList.add("rsys_header_btn_stop");
                } else {
                    btn.mount.classList.remove("rsys_header_btn_stop");
                }
                btn.mount.classList.remove("loading_btn");
            })
            .AddOnClick((btn: SystemHeaderButtonBuilder) => {
                btn.mount.classList.add("loading_btn");
                this.conn.Radio.Power.SetValue(!this.conn.Radio.Power.GetValue());
            })
            .Build(this.mount);
        new SystemHeaderButtonBuilder("rsys_header_btn_sound")
            .Build(this.mount);
        new SystemHeaderButtonBuilder("rsys_header_btn_logout")
            .AddOnClick(() => {
                var menu: IRaptorMenu;
                var builder = new RaptorMenuBuilder(400, 220)
                    .SetTitleNegative("Log Out")
                    .SetContent(new RaptorPanelBuilder()
                        .AddText("Are you sure you want to log out of RaptorSDR?")
                        .Build()
                    )
                    .NavBtnAddNegative("Log Out", () => {
                        localStorage.setItem("RAPTOR_REFRESH_TOKEN", null);
                        menu.Close();
                        window.location.reload();
                    })
                    .NavBtnAddNeutral("Cancel", () => {
                        menu.Close();
                    });
                menu = this.conn.ShowMenu(builder);
            })
            .Build(this.mount);

        //Make tuner
        new RaptorSystemTuner(this.mount, this.conn);
    }

    private mount: HTMLElement;
    private conn: IRaptorConnection;

}

class SystemHeaderButtonBuilder {

    constructor(classname: string) {
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_header_button", null);
        this.clicker = RaptorUiUtil.CreateDom("div", "rsys_header_button_clicker", this.mount);
        this.mount.classList.add(classname);
    }

    mount: HTMLElement;
    clicker: HTMLElement;

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

    Build(container: HTMLElement) {
        container.appendChild(this.mount);
    }

}