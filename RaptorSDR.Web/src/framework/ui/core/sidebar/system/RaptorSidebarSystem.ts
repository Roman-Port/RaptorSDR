import { RaptorSettingsTab } from "../../../../../../sdk/ui/setting/RaptorSettingsTab";
import RaptorUiUtil from "../../../../../../sdk/util/RaptorUiUtil";
import RaptorApp from "../../../../../RaptorApp";
import RaptorSidebarBase from "../RaptorSidebarBase";
import RaptorSidebarSystemTab from "./RaptorSidebarSystemTab";

export default class RaptorSidebarSystem extends RaptorSidebarBase {

    constructor(app: RaptorApp, mount: HTMLElement) {
        super(mount);
        this.app = app;

        //Set up
        mount.classList.add("rsys_sidebarsys");

        //Make footer
        this.footer = RaptorUiUtil.CreateDom("div", "rsys_sidebarsys_footer", this.body);

        //Create tabs
        this.tabs = [
            new RaptorSidebarSystemTab(this, this.app.settingStore, this.content, app.settingStore.GetProviderSidebar(RaptorSettingsTab.GENRAL), "rsys_sidebarsys_footer_btn_general"),
            new RaptorSidebarSystemTab(this, this.app.settingStore, this.content, app.settingStore.GetProviderSidebar(RaptorSettingsTab.EXTRA), "rsys_sidebarsys_footer_btn_extra"),
            new RaptorSidebarSystemTab(this, this.app.settingStore, this.content, app.settingStore.GetProviderSidebar(RaptorSettingsTab.PLUGIN), "rsys_sidebarsys_footer_btn_plugin"),
            new RaptorSidebarSystemTab(this, this.app.settingStore, this.content, app.settingStore.GetProviderPinned(), "rsys_sidebarsys_footer_btn_pinned"),
        ];

        //Set active
        this.SetActiveTab();
    }

    private app: RaptorApp;
    private tabs: RaptorSidebarSystemTab[];
    private currentTab: number = 0;

    footer: HTMLElement;

    RefreshAll() {
        for (var i = 0; i < this.tabs.length; i++)
            this.tabs[i].page.Refresh();
    }

    SwitchTab(direction: number) {
        //Advance
        this.currentTab += direction;

        //Clamp
        if (this.currentTab < 0)
            this.currentTab += this.tabs.length;
        if (this.currentTab >= this.tabs.length)
            this.currentTab -= this.tabs.length;

        //Configure status
        this.SetActiveTab();
    }

    SetTab(tab: RaptorSidebarSystemTab) {
        for (var i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i] == tab)
                this.currentTab = i;
        }
        this.SetActiveTab();
    }

    private SetActiveTab() {
        for (var i = 0; i < this.tabs.length; i++)
            this.tabs[i].SetStatus(i == this.currentTab);
    }

}