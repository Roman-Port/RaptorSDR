import IRaptorSettingsRegion from "../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import RaptorUiUtil from "../../../../../sdk/util/RaptorUiUtil";

export default class RaptorSettingsRegionInstance {

    constructor(data: IRaptorSettingsRegion) {
        //Configure
        this.data = data;

        //Create view
        this.body = RaptorUiUtil.CreateDom("div", null);
        this.title = RaptorUiUtil.CreateDom("div", "rsys_settings_regiontitle", this.body);
        RaptorUiUtil.CreateDom("div", null, this.title).innerText = this.data.name;
        RaptorUiUtil.CreateDom("div", "rsys_settings_regiontitle_line", this.title);

        //Create components
        for (var i = 0; i < this.data.components.length; i++) {
            var e = this.data.components[i].Build();
            this.components.push(e);
            this.body.appendChild(e);
        }
    }

    private body: HTMLElement;
    private title: HTMLElement;
    private data: IRaptorSettingsRegion;
    private components: HTMLElement[] = [];

    MountTo(container: HTMLElement): RaptorSettingsRegionInstance {
        container.appendChild(this.body);
        return this;
    }

    Destroy() {
        //Destroy all components
        for (var i = 0; i < this.data.components.length; i++)
            this.data.components[i].Destroy(this.components[i]);

        //Remove root
        this.body.remove();
    }

}