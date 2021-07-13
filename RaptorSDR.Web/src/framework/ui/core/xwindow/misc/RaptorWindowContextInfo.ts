import IRaptorConnection from "../../../../../../sdk/IRaptorConnection";
import IRaptorWindowInfo from "../../../../../../sdk/ui/core/IRaptorWindowInfo";
import IRaptorSettingsRegion from "../../../../../../sdk/ui/setting/IRaptorSettingsRegion";
import RaptorSettingsRegionBuilder from "../../../../../../sdk/ui/setting/RaptorSettingsRegionBuilder";
import { RaptorSettingsTab } from "../../../../../../sdk/ui/setting/RaptorSettingsTab";
import RaptorPluginRegisteredWindowInstance from "../../../../plugin/RaptorPluginRegisteredWindowInstance";
import RaptorMenuWindowStore from "../RaptorMenuWindowStore";

export default class RaptorWindowContextInfo implements IRaptorWindowInfo {

    constructor(data: RaptorPluginRegisteredWindowInstance) {
        this.id = RaptorMenuWindowStore.GetInstanceId(data);
        this.info = data.info.info;
    }

    id: string;
    info: any;

}