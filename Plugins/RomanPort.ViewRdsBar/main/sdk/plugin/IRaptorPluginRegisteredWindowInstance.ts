import { RaptorWindowMounting } from "../ui/core/RaptorWindowMounting";

export default interface IRaptorPluginRegisteredWindowInstance {

    RequestMount(location: RaptorWindowMounting, priority: number): IRaptorPluginRegisteredWindowInstance;

}