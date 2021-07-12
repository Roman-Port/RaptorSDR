import RaptorUiUtil from "../sdk/util/RaptorUiUtil";
import RaptorConnection from "./framework/RaptorConnection";
import RaptorSystemHeader from "./framework/ui/core/header/RaptorSystemHeader";
import RaptorSettingsStore from "./framework/ui/core/setting/RaptorSettingsStore";
import RaptorSystemSettings from "./framework/ui/core/setting/RaptorSystemSettings";
import RaptorSidebarSystem from "./framework/ui/core/sidebar/system/RaptorSidebarSystem";
import RaptorMenuWindowStore from "./framework/ui/core/xwindow/RaptorMenuWindowStore";
import RaptorRootWindowManager from "./framework/ui/core/xwindow/RaptorRootWindowManager";
import RaptorLoginPage from "./framework/ui/login/RaptorLoginPage";
import RaptorMenuMount from "./framework/ui/menu/RaptorMenuMount";
import IRaptorUserInfo from "./framework/web/IRaptorUserInfo";

require("./colors.css");
require("./main.css");

export default class RaptorApp {

    constructor() {
        this.conn = new RaptorConnection(this, window.location.host);
    }

    conn: RaptorConnection;
    mount: HTMLElement;
    uiSidebar: RaptorSidebarSystem;
    uiHeader: RaptorSystemHeader;
    menuMount: RaptorMenuMount;
    menuManager: RaptorRootWindowManager;

    windowStore: RaptorMenuWindowStore;
    settingStore: RaptorSettingsStore;

    async Init() {
        //Create stores
        this.windowStore = new RaptorMenuWindowStore(this);
        this.settingStore = new RaptorSettingsStore();

        //Create basic views
        this.mount = RaptorUiUtil.CreateDom("div", "raptor", document.body);
        this.uiSidebar = new RaptorSidebarSystem(this, this.mount);
        this.uiHeader = new RaptorSystemHeader(this.mount, this.uiSidebar.header, this.conn);
        this.menuMount = new RaptorMenuMount(this.mount);
        this.menuManager = new RaptorRootWindowManager(this);

        //Load
        await this.Preload();

        //Register default settings
        RaptorSystemSettings.CreateSystemSettings(this);

        //Update complex UIs
        this.uiHeader.Populate();
        this.menuManager.Initialize();
        this.uiSidebar.RefreshAll();
    }

    private async Preload() {
        //Create preloader view
        var preloader = new RaptorLoginPage(this.mount, this.conn);

        //Get status
        preloader.SetLoading(true);
        var status = (await this.conn.GetInfo()).status;
        preloader.SetLoading(false);

        //Authenticate
        var info = await this.Authenticate(preloader);

        //Connect
        preloader.SetLoading(true);
        await this.conn.Init(info);
        preloader.SetLoading(false);

        //Reveal
        preloader.Remove();
    }

    private async Authenticate(preloader: RaptorLoginPage): Promise<IRaptorUserInfo> {
        //Attempt to query our user info
        preloader.SetLoading(true);
        try {
            var userData = await this.conn.AuthGetInfo();
            preloader.SetLoading(false);
            return userData;
        } catch {
            preloader.SetLoading(false);
        }

        //Login is needed
        return await preloader.PromptLogin();
    }

}