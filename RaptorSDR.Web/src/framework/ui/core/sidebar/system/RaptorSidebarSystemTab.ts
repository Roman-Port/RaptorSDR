import { RaptorSettingsTab } from "../../../../../../sdk/ui/setting/RaptorSettingsTab";
import RaptorUiUtil from "../../../../../../sdk/util/RaptorUiUtil";
import RaptorSettingsPage from "../../setting/RaptorSettingsPage";
import RaptorSettingsStore from "../../setting/RaptorSettingsStore";

require("./sidebar_sys.css");

export default class RaptorSidebarSystemTab {

    constructor(container: HTMLElement, tab: RaptorSettingsTab, store: RaptorSettingsStore) {
        //Configure
        this.tab = tab;
        this.store = store;

        //Create mount
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_sidebarsys_tab", container);

        //Create page
        this.page = new RaptorSettingsPage(this.store.GetProviderSidebar(this.tab));
        this.page.MountTo(this.mount);
        this.page.Refresh();
    }

    private mount: HTMLElement;
    private tab: RaptorSettingsTab;
    private store: RaptorSettingsStore;

    page: RaptorSettingsPage;

}