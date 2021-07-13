import RaptorUiUtil from "../../../../../../sdk/util/RaptorUiUtil";
import RaptorPluginRegisteredWindowInstance from "../../../../plugin/RaptorPluginRegisteredWindowInstance";
import RaptorWindowContextInfo from "../misc/RaptorWindowContextInfo";
import RaptorMenuWindowStore from "../RaptorMenuWindowStore";
import RaptorRootWindowManager from "../RaptorRootWindowManager";

export default class RaptorWindowEditorRegion {

    constructor(container: HTMLElement, manager: RaptorRootWindowManager, instances: RaptorPluginRegisteredWindowInstance[]) {
        //Configure
        this.instances = instances;
        this.manager = manager;

        //Set up
        this.body = RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region", container);

        //Create header
        var header = RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_header", this.body);
        RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_header_text", header).innerText = instances[0].windowClass.plugin.plugin_name;
        RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_header_line", header);

        //Create items
        for (var i = 0; i < this.instances.length; i++)
            this.CreateItem(this.instances[i]);
    }

    private body: HTMLElement;
    private manager: RaptorRootWindowManager;
    private instances: RaptorPluginRegisteredWindowInstance[];

    private CreateItem(data: RaptorPluginRegisteredWindowInstance) {
        //Build main stuff
        var body = RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_item", this.body);
        var content = RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_item_content", body);
        var preview = RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_item_content_preview", content);

        //Add titles and preview
        RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_item_content_classname", content).innerText = data.windowClass.GetName();
        RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_item_content_instancename", content).innerText = data.info.displayName;
        RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_region_item_content_preview_box", preview).appendChild(this.CreatePreview(data));

        //Make modal
        body.appendChild(this.CreateModal(data));

        //Bind events
        content.addEventListener("mousedown", (evt: MouseEvent) => {
            this.manager.CreateWindow({
                className: data.windowClass.info.id,
                instanceName: RaptorMenuWindowStore.GetInstanceId(data),
                userPersist: {}
            });
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    private CreateModal(data: RaptorPluginRegisteredWindowInstance): HTMLElement {
        //Build main
        var modal = RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_modal");
        var preview = RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_modal_preview", modal);

        //Add sections
        modal.appendChild(this.CreateModalSection("Window Type", data.windowClass.GetName()));
        modal.appendChild(this.CreateModalSection("Window Name", data.info.displayName));
        modal.appendChild(this.CreateModalSection("Provided By", data.windowClass.plugin.plugin_name + " by " + data.windowClass.plugin.developer_name));

        //Create preview
        preview.appendChild(this.CreatePreview(data));

        return modal;
    }

    private CreateModalSection(title: string, text: string): HTMLElement {
        var e = RaptorUiUtil.CreateDom("div", null);
        RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_modal_title", e).innerText = title;
        RaptorUiUtil.CreateDom("div", "rsys_xwindow_sidebar_modal_text", e).innerText = text;
        return e;
    }

    private CreatePreview(data: RaptorPluginRegisteredWindowInstance): HTMLElement {
        var preview: HTMLElement = null;
        try {
            preview = data.windowClass.info.createDummy(new RaptorWindowContextInfo(data));
        } catch (e) {
            console.warn("[RaptorWindowEditorRegion] Encountered error while creating window preview in editor for plugin \"" + data.windowClass.plugin.id + "\", skipping...");
        }
        if (preview == null)
            preview = RaptorUiUtil.CreateDom("div", null);
        return preview;
    }

}