import IRaptorConnection from "../../../../../../sdk/IRaptorConnection";
import IRaptorWindowContext from "../../../../../../sdk/ui/core/IRaptorWindowContext";
import IRaptorSettingsRegion from "../../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import RaptorSettingsRegionBuilder from "../../../../../../sdk/ui/setting/RaptorSettingsRegionBuilder";
import { RaptorSettingsTab } from "../../../../../../sdk/ui/setting/RaptorSettingsTab";

export default class RaptorWindowContext implements IRaptorWindowContext {

    constructor(conn: IRaptorConnection, id: string, info: any, persist: any) {
        this.conn = conn;
        this.id = id;
        this.info = info;
        this.persist = persist;
    }

    conn: IRaptorConnection;
    id: string;
    info: any;
    persist: any;

    CreateSettingsRegion(name: string, id: string): RaptorSettingsRegionBuilder {
        return new RaptorSettingsRegionBuilder(name, this.id + "." + id, this.conn);
    }

    RegisterSettingsRegionSidebar(region: IRaptorSettingsRegion, tab: RaptorSettingsTab): void {
        this.conn.RegisterSettingsRegionSidebar(region, tab);
    }

}