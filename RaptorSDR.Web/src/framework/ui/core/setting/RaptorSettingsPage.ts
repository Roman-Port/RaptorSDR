import IRaptorSettingsComponent from "../../../../../sdk/ui/setting/IRaptorSettingsComponent";
import IRaptorSettingsRegion from "../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import RaptorUiUtil from "../../../../../sdk/util/RaptorUiUtil";
import RaptorSettingsRegionInstance from "./RaptorSettingsRegionInstance";
import RaptorSettingsStore from "./RaptorSettingsStore";

require("./settings.css");
require("./settings_generic.css");

export default class RaptorSettingsPage {

    constructor(store: RaptorSettingsStore, provider: () => IRaptorSettingsRegion[]) {
        //Configure
        this.provider = provider;

        //Create mount
        this.mount = RaptorUiUtil.CreateDom("div", null);

        //Bind
        store.OnRegionsUpdated.Bind(() => this.Refresh());
    }

    private provider: () => IRaptorSettingsRegion[];
    private mount: HTMLElement;
    private activeRegions: RaptorSettingsRegionInstance[] = [];

    Refresh() {
        //Request a list of regions to create
        var regions = this.provider();

        //Destroy all current regions
        this.DestroyAll();

        //Create all
        for (var i = 0; i < regions.length; i++)
            this.activeRegions.push(new RaptorSettingsRegionInstance(regions[i]).MountTo(this.mount));
    }

    MountTo(container: HTMLElement): RaptorSettingsPage {
        container.appendChild(this.mount);
        return this;
    }

    private DestroyAll() {
        //Correctly destroy all components
        for (var i = 0; i < this.activeRegions.length; i++)
            this.activeRegions[i].Destroy();
    }

}