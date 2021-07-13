import IRaptorSettingsRegion from "../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import RaptorUiUtil from "../../../../../sdk/util/RaptorUiUtil";
import RaptorSettingsStore from "./RaptorSettingsStore";

export default class RaptorSettingsRegionInstance {

    constructor(data: IRaptorSettingsRegion) {
        //Configure
        this.data = data;

        //Create view
        this.body = RaptorUiUtil.CreateDom("div", null);
        this.title = RaptorUiUtil.CreateDom("div", "rsys_settings_regiontitle", this.body);
        RaptorUiUtil.CreateDom("div", "rsys_settings_regiontitle_text", this.title).innerText = this.data.name;
        RaptorUiUtil.CreateDom("div", "rsys_settings_regiontitle_line", this.title);
        this.titlePin = RaptorUiUtil.CreateDom("div", "rsys_settings_regiontitle_pin", this.title);

        //Create components
        for (var i = 0; i < this.data.components.length; i++) {
            var e = this.data.components[i].Build();
            this.components.push(e);
            this.body.appendChild(e);
        }

        //Configure pin
        this.UpdatePinnedIcon();
        this.titlePin.addEventListener("click", (evt: MouseEvent) => {
            if (this.IsPinned())
                RaptorSettingsStore.UnpinRegion(this.data);
            else
                RaptorSettingsStore.PinRegion(this.data);
            evt.preventDefault();
            evt.stopPropagation();
        });
        RaptorSettingsStore.OnPinsUpdated.Bind(() => {
            this.UpdatePinnedIcon();
        });
    }

    private body: HTMLElement;
    private title: HTMLElement;
    private titlePin: HTMLElement;
    private data: IRaptorSettingsRegion;
    private components: HTMLElement[] = [];

    private UpdatePinnedIcon(): boolean {
        if (this.IsPinned()) {
            this.titlePin.classList.add("rsys_settings_regiontitle_pin_active");
            return true;
        } else {
            this.titlePin.classList.remove("rsys_settings_regiontitle_pin_active");
            return false;
        }
    }

    IsPinned(): boolean {
        return RaptorSettingsStore.IsRegionPinned(this.data);
    }

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