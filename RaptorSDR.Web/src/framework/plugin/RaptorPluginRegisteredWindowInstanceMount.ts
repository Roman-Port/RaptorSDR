import { RaptorWindowMounting } from "../../../sdk/ui/core/RaptorWindowMounting";
import RaptorPluginRegisteredWindowInstance from "./RaptorPluginRegisteredWindowInstance";

//Represents a mounting request
export default class RaptorPluginRegisteredWindowInstanceMount {

    constructor(instance: RaptorPluginRegisteredWindowInstance, location: RaptorWindowMounting, priority: number) {
        this.instance = instance;
        this.location = location;
        this.priority = priority;
    }

    instance: RaptorPluginRegisteredWindowInstance;
    location: RaptorWindowMounting;
    priority: number;

}