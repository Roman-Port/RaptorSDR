import IRaptorMenu from "../../../../sdk/ui/menu/IRaptorMenu";
import RaptorMenuBuilder from "../../../../sdk/ui/menu/RaptorMenuBuilder";
import RaptorUiUtil from "../RaptorUiUtil";
import RaptorMenuMount from "./RaptorMenuMount";

export default class RaptorMenu implements IRaptorMenu {

    constructor(mount: RaptorMenuMount, content: HTMLElement) {
        //Configure
        this.mount = mount;

        //Apply
        (content as any)._xraptor_menu = this;

        //Make frame
        this.frame = RaptorUiUtil.CreateDom("div", "rsys_menu_frame", mount.mount);
        this.frame.appendChild(content);
    }

    mount: RaptorMenuMount;
    frame: HTMLElement;
    content: HTMLElement;

    Close() {
        this.mount.CloseMenu(this);
    }

}