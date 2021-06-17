import RaptorConnection from "./framework/RaptorConnection";
import RaptorSystemHeader from "./framework/ui/core/header/RaptorSystemHeader";
import RaptorMenuWindowStore from "./framework/ui/core/xwindow/RaptorMenuWindowStore";
import RaptorRootWindowManager from "./framework/ui/core/xwindow/RaptorRootWindowManager";
import RaptorLoginPage from "./framework/ui/login/RaptorLoginPage";
import RaptorMenuMount from "./framework/ui/menu/RaptorMenuMount";
import RaptorUiUtil from "./framework/ui/RaptorUiUtil";

require("./colors.css");
require("./main.css");

export default class RaptorApp {

    constructor() {
        //Create store
        this.windowStore = new RaptorMenuWindowStore(this);

        //Create connection
        this.conn = new RaptorConnection(this, window.location.host);
    }

    conn: RaptorConnection;
    mount: HTMLElement;
    uiHeader: RaptorSystemHeader;
    menuMount: RaptorMenuMount;
    menuManager: RaptorRootWindowManager;

    windowStore: RaptorMenuWindowStore;

    async Init() {
        //Create basic views
        this.mount = RaptorUiUtil.CreateDom("div", "raptor", document.body);
        this.uiHeader = new RaptorSystemHeader(this.mount, this.conn);
        this.menuMount = new RaptorMenuMount(this.mount);
        this.menuManager = new RaptorRootWindowManager(this);

        //Create preloader view
        var preloader = new RaptorLoginPage(this.mount, this.conn);

        //Use the refresh token to attempt to login
        preloader.SetLoading(true);
        var refreshResponse = await this.conn.GetHttpRequest("/accounts/login", "POST")
            .SetBody(JSON.stringify({
                "auth_type": "REFRESH",
                "refresh_token": localStorage.getItem("RAPTOR_REFRESH_TOKEN")
            }))
            .AsJSON<any>();
        preloader.SetLoading(false);

        //Login if needed, otherwise use the refresh token
        var token;
        if (refreshResponse["ok"]) {
            token = refreshResponse["session_token"];
        } else {
            token = await preloader.PromptLogin();
        }

        //Connect
        preloader.SetLoading(true);
        await this.conn.Init(token);
        preloader.SetLoading(false);

        //Populate complex UIs
        this.uiHeader.Populate();
        this.menuManager.Initialize();

        //Reveal
        preloader.Remove();
    }

}