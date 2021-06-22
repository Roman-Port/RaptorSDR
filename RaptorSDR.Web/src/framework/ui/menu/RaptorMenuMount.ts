import IRaptorMenu from "../../../../sdk/ui/menu/IRaptorMenu";
import RaptorMenuBuilder from "../../../../sdk/ui/menu/RaptorMenuBuilder";
import RaptorUiUtil from "../../../../sdk/util/RaptorUiUtil";
import RaptorMenu from "./RaptorMenu";

require("./menu.css");
require("./panel.css");

export default class RaptorMenuMount {

    constructor(mount: HTMLElement) {
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_menu_container", mount);
    }

    mount: HTMLElement;

    BuildShowMenu(builder: RaptorMenuBuilder): IRaptorMenu {
        //Create menu
        var menu = new RaptorMenu(this, builder.Build());

        //Update states
        this.UpdateQueue();

        return menu;
    }

    CloseMenu(menu: RaptorMenu) {
        if (menu.frame.classList.contains("rsys_menu_frame_active")) {
            //Active menu. Hide it
            menu.frame.classList.remove("rsys_menu_frame_active");

            //Wait for animation to complete
            window.setTimeout(() => {
                //Unset as active
                menu.frame.remove();

                //Update queue
                this.UpdateQueue();
            }, 150);
        } else {
            //In queue. Just remove it now
            menu.frame.remove();
        }
    }

    private UpdateQueue() {
        //Set all items except last to be hidden
        for (var i = 0; i < this.mount.children.length - 1; i++) {
            this.mount.children[i].classList.remove("rsys_menu_frame_active");
        }

        //Make sure the bottom-most one is shown, or hide the entire thing
        if (this.mount.children.length >= 1) {
            this.mount.children[this.mount.children.length - 1].classList.add("rsys_menu_frame_active");
            this.mount.classList.add("rsys_menu_container_active");
        } else {
            this.mount.classList.remove("rsys_menu_container_active");
        }
    }

}