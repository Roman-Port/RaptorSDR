import { RaptorSettingsTab } from "../../../../../../sdk/ui/setting/RaptorSettingsTab";
import RaptorApp from "../../../../../RaptorApp";
import RaptorSidebarBase from "../RaptorSidebarBase";
import RaptorSidebarSystemTab from "./RaptorSidebarSystemTab";

export default class RaptorSidebarSystem extends RaptorSidebarBase {

    constructor(app: RaptorApp, mount: HTMLElement) {
        super(mount);
        this.app = app;

        //Create tabs
        this.tabs = [
            new RaptorSidebarSystemTab(this.content, RaptorSettingsTab.GENRAL, app.settingStore),
            new RaptorSidebarSystemTab(this.content, RaptorSettingsTab.EXTRA, app.settingStore),
            new RaptorSidebarSystemTab(this.content, RaptorSettingsTab.PLUGIN, app.settingStore),
            new RaptorSidebarSystemTab(this.content, RaptorSettingsTab.PINNED, app.settingStore),
        ];
    }

    private app: RaptorApp;
    private tabs: RaptorSidebarSystemTab[];

    RefreshAll() {
        for (var i = 0; i < this.tabs.length; i++)
            this.tabs[i].page.Refresh();
    }

}