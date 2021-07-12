import RaptorMenuBuilder from "../../../../sdk/ui/menu/RaptorMenuBuilder";
import RaptorUiUtil from "../../../../sdk/util/RaptorUiUtil";
import RaptorConnection from "../../RaptorConnection";
import AdvancedSettingsButton from "./AdvancedSettingsButton";
import LogOutButton from "./buttons/LogOutButton";
import ResetLayoutButton from "./buttons/ResetLayoutButton";

require("./dialog.css");

export default class AdvancedSettingsDialog {

    constructor(conn: RaptorConnection) {
        this.conn = conn;
        this.content = RaptorUiUtil.CreateDom("div", "rsys_asettings");
        this.sidebar = RaptorUiUtil.CreateDom("div", "rsys_asettings_sidebar", this.content);
        this.main = RaptorUiUtil.CreateDom("div", "rsys_asettings_body", this.main);
        this.CreateButtons();
    }

    conn: RaptorConnection;

    private buttons: AdvancedSettingsButton[] = [];
    private sidebarSections: { [index: number]: HTMLElement } = {};
    private content: HTMLElement;
    private sidebar: HTMLElement;
    main: HTMLElement;

    Show() {
        var builder = new RaptorMenuBuilder(800, 550);
        this.BuildDialog(builder);
        this.conn.ShowMenu(builder);
    }

    protected BuildDialog(builder: RaptorMenuBuilder) {
        builder.SetTitleNeutral("RaptorSDR Settings");
        builder.SetContent(this.content);
    }

    private CreateButtons() {
        this.buttons.push(new AdvancedSettingsButton(this, "Test 1", 1));
        this.buttons.push(new AdvancedSettingsButton(this, "Test 2", 1));
        this.buttons.push(new AdvancedSettingsButton(this, "Test 3", 1));
        this.buttons.push(new ResetLayoutButton(this));
        this.buttons.push(new LogOutButton(this));
    }

    GetSidebarSection(id: number): HTMLElement {
        if (this.sidebarSections[id] == null) {
            this.sidebarSections[id] = RaptorUiUtil.CreateDom("div", "rsys_asettings_sidebar_section", this.sidebar);
        }
        return this.sidebarSections[id];
    }

    DeactivateAll() {
        for (var i = 0; i < this.buttons.length; i++)
            this.buttons[i].SetActive(false);
    }

}