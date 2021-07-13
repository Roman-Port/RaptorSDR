import IRaptorSettingsRegion from "../../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import { RaptorSettingsTab } from "../../../../../../sdk/ui/setting/RaptorSettingsTab";
import RaptorUiUtil from "../../../../../../sdk/util/RaptorUiUtil";
import RaptorSettingsPage from "../../setting/RaptorSettingsPage";
import RaptorSettingsStore from "../../setting/RaptorSettingsStore";
import RaptorSidebarSystem from "./RaptorSidebarSystem";

require("./sidebar_sys.css");

export default class RaptorSidebarSystemTab {

    constructor(controller: RaptorSidebarSystem, container: HTMLElement, provider: () => IRaptorSettingsRegion[], footerName: string) {
        //Create footer
        this.footerItem = RaptorUiUtil.CreateDom("div", "rsys_sidebarsys_footer_btn", controller.footer)
            .AddClass(footerName);
        this.footerItem.addEventListener("click", () => controller.SetTab(this));

        //Create mount
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_sidebarsys_tab", container);

        //Create events
        this.mount.addEventListener("wheel", (evt: WheelEvent) => {
            if (this.mount.scrollTop + this.mount.clientHeight >= this.mount.scrollHeight && evt.deltaY > 0) {
                controller.SwitchTab(1);
            } else if (this.mount.scrollTop <= 0 && evt.deltaY < 0) {
                controller.SwitchTab(-1);
            }
        });

        //Create page
        this.page = new RaptorSettingsPage(provider);
        this.page.MountTo(this.mount);
        this.page.Refresh();
    }

    private mount: HTMLElement;
    private footerItem: HTMLElement;

    page: RaptorSettingsPage;

    SetStatus(enabled: boolean) {
        if (enabled) {
            this.mount.classList.remove("rsys_sidebarsys_tab_disabled");
            this.footerItem.classList.add("rsys_sidebarsys_footer_btndown");
            this.mount.scrollTop = 0;
        }
        else {
            this.mount.classList.add("rsys_sidebarsys_tab_disabled");
            this.footerItem.classList.remove("rsys_sidebarsys_footer_btndown");
        }
    }

}