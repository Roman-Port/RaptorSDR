import RaptorConnection from "./framework/RaptorConnection";
import RaptorSystemHeader from "./framework/ui/core/header/RaptorSystemHeader";
import RaptorWindowContainer from "./framework/ui/core/window/RaptorWindowContainer";
import RaptorWindowView from "./framework/ui/core/window/RaptorWindowTab";
import RaptorUiUtil from "./framework/ui/RaptorUiUtil";

require("./colors.css");
require("./main.css");

export default class RaptorApp {

    constructor() {
        //Create connection
        this.conn = new RaptorConnection(window.location.host);

        //Create views
        this.mount = RaptorUiUtil.CreateDom("div", "raptor", document.body);
        this.uiHeader = new RaptorSystemHeader(this.mount);
        this.uiBody = new RaptorWindowView(this.mount);
    }

    private conn: RaptorConnection;
    private mount: HTMLElement;
    private uiHeader: RaptorSystemHeader;
    private uiBody: RaptorWindowView;

}