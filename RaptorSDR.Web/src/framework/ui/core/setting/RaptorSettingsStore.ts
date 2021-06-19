import IRaptorSettingsRegion from "../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import { RaptorSettingsTab } from "../../../../../sdk/ui/setting/RaptorSettingsTab";

export default class RaptorSettingsStore {

    constructor() {

    }

    private sidebarRegions: IRaptorSettingsStoreSidebarEntry[] = [];

    RegisterSidebarRegion(region: IRaptorSettingsRegion, tab: RaptorSettingsTab) {
        this.sidebarRegions.push({
            region: region,
            tab: tab
        });
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

}

interface IRaptorSettingsStoreSidebarEntry {

    region: IRaptorSettingsRegion;
    tab: RaptorSettingsTab;

}