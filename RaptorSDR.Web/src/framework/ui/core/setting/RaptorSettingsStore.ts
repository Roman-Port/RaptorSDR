import RaptorEventDispaptcher from "../../../../../sdk/RaptorEventDispatcher";
import IRaptorSettingsRegion from "../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import { RaptorSettingsTab } from "../../../../../sdk/ui/setting/RaptorSettingsTab";

export default class RaptorSettingsStore {

    constructor() {
        RaptorSettingsStore.OnPinsUpdated.Bind(() => this.OnRegionsUpdated.Fire());
    }

    OnRegionsUpdated: RaptorEventDispaptcher<void> = new RaptorEventDispaptcher();

    private sidebarRegions: IRaptorSettingsStoreSidebarEntry[] = [];

    RegisterSidebarRegion(region: IRaptorSettingsRegion, tab: RaptorSettingsTab) {
        //Add
        this.sidebarRegions.push({
            region: region,
            tab: tab
        });

        //Apply
        this.OnRegionsUpdated.Fire();
    }

    UnregisterRegion(region: IRaptorSettingsRegion) {
        //Remove matching regions in the sidebar
        for (var i = 0; i < this.sidebarRegions.length; i++) {
            if (this.sidebarRegions[i].region == region) {
                this.sidebarRegions.splice(i);
                i--;
            }
        }

        //Apply
        this.OnRegionsUpdated.Fire();
    }

    GetProviderSidebar(tab: RaptorSettingsTab): () => IRaptorSettingsRegion[] {
        return (): IRaptorSettingsRegion[] => {
            var regions: IRaptorSettingsRegion[] = [];
            for (var i = 0; i < this.sidebarRegions.length; i++) {
                if (this.sidebarRegions[i].tab == tab)
                    regions.push(this.sidebarRegions[i].region);
            }
            return regions;
        }
    }

    GetProviderPinned(): () => IRaptorSettingsRegion[] {
        return (): IRaptorSettingsRegion[] => {
            var regions: IRaptorSettingsRegion[] = [];
            for (var i = 0; i < this.sidebarRegions.length; i++) {
                if (RaptorSettingsStore.IsRegionPinned(this.sidebarRegions[i].region))
                    regions.push(this.sidebarRegions[i].region);
            }
            return regions;
        };
    }

    private static pinnedIds: string[] = localStorage.getItem("RAPTOR_PINNED_SETTINGS") == null ? [] : JSON.parse(localStorage.getItem("RAPTOR_PINNED_SETTINGS"));
    static OnPinsUpdated: RaptorEventDispaptcher<void> = new RaptorEventDispaptcher();

    static IsRegionPinned(region: IRaptorSettingsRegion) {
        return this.pinnedIds.includes(region.id);
    }

    static PinRegion(region: IRaptorSettingsRegion) {
        if (!this.pinnedIds.includes(region.id))
            this.pinnedIds.push(region.id);
        this.SavePins();
    }

    static UnpinRegion(region: IRaptorSettingsRegion) {
        var index = this.pinnedIds.indexOf(region.id);
        if (index != -1)
            this.pinnedIds.splice(index, 1);
        this.SavePins();
    }

    private static SavePins() {
        localStorage.setItem("RAPTOR_PINNED_SETTINGS", JSON.stringify(this.pinnedIds));
        this.OnPinsUpdated.Fire();
    }

}

interface IRaptorSettingsStoreSidebarEntry {

    region: IRaptorSettingsRegion;
    tab: RaptorSettingsTab;

}