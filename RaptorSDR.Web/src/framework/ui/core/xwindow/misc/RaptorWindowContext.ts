import IRaptorConnection from "../../../../../../sdk/IRaptorConnection";
import IRaptorWindowContext from "../../../../../../sdk/ui/core/IRaptorWindowContext";
import IRaptorSettingsRegion from "../../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import RaptorSettingsRegionBuilder from "../../../../../../sdk/ui/setting/RaptorSettingsRegionBuilder";
import { RaptorSettingsTab } from "../../../../../../sdk/ui/setting/RaptorSettingsTab";
import RaptorPluginRegisteredWindowInstance from "../../../../plugin/RaptorPluginRegisteredWindowInstance";
import RaptorWindowContextInfo from "./RaptorWindowContextInfo";

export default class RaptorWindowContext extends RaptorWindowContextInfo implements IRaptorWindowContext {

    constructor(conn: IRaptorConnection, data: RaptorPluginRegisteredWindowInstance, persist: any) {
        super(data);
        this.conn = conn;
        this.persist = persist;
    }

    conn: IRaptorConnection;
    persist: any;

    private boundRegions: IRaptorSettingsRegion[] = [];

    CreateSettingsRegion(name: string, id: string): RaptorSettingsRegionBuilder {
        return new RaptorSettingsRegionBuilder(name, this.id + "." + id, this.conn);
    }

    RegisterSettingsRegionSidebar(region: IRaptorSettingsRegion, tab: RaptorSettingsTab): void {
        this.conn.RegisterSettingsRegionSidebar(region, tab);
        this.boundRegions.push(region);
    }

    Dispose() {
        //Unbind all regions
        for (var i = 0; i < this.boundRegions.length; i++)
            this.conn.UnregisterSettingsRegion(this.boundRegions[i]);
    }

}