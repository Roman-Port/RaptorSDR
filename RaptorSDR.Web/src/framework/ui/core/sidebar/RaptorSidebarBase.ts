import RaptorUiUtil from "../../../../../sdk/util/RaptorUiUtil";

require("./sidebar.css");

export default class RaptorSidebarBase {

    constructor(mount: HTMLElement) {
        this.body = RaptorUiUtil.CreateDom("div", "rsys_sidebar", mount);
        this.header = RaptorUiUtil.CreateDom("div", "rsys_sidebar_header", this.body);
        this.content = RaptorUiUtil.CreateDom("div", "rsys_sidebar_content", this.body);
    }

    private body: HTMLElement;

    header: HTMLElement;
    content: HTMLElement;

}