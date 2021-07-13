import RaptorUiUtil from "../../../../../../sdk/util/RaptorUiUtil";
import RaptorHeaderButtonBuilder from "../../header/button/RaptorHeaderButtonBuilder";
import RaptorHeaderButtonSheet from "../../header/button/RaptorHeaderButtonSheet";
import RaptorSidebarBase from "../../sidebar/RaptorSidebarBase";
import RaptorRootWindowManager from "../RaptorRootWindowManager";
import RaptorWindowEditorRegion from "./RaptorWindowEditorRegion";

require("./editor_sidebar.css");

export default class RaptorWindowEditorSidebar extends RaptorSidebarBase {

    constructor(container: HTMLElement, manager: RaptorRootWindowManager) {
        super(container);
        this.manager = manager;
        this.body.classList.add("rsys_xwindow_sidebar");

        //Create header
        new RaptorHeaderButtonBuilder("rsys_xwindow_sidebar_header_back")
            .MakeWhite()
            .AddOnClick(() => {
                this.manager.LeaveEditingMode();
            })
            .Build(new RaptorHeaderButtonSheet(this.header));
        RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_header_text", this.header).innerText = "Editing Layout";
    }

    private manager: RaptorRootWindowManager;
    private regions: RaptorWindowEditorRegion[] = [];

    Enable() {
        this.body.classList.add("rsys_xwindow_sidebar_active");
    }

    Disable() {
        this.body.classList.remove("rsys_xwindow_sidebar_active");
    }

    Initialize() {
        //Get all instances by their plugin
        var windowInstances = this.manager.store.GetInstancesByPlugin();

        //Create regions
        for (var i = 0; i < windowInstances.length; i++)
            this.regions.push(new RaptorWindowEditorRegion(this.content, this.manager, windowInstances[i]));
    }

}