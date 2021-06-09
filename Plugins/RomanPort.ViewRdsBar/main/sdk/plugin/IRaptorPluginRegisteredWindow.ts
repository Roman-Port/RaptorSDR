import IRaptorPluginRegisteredWindowInstance from "./IRaptorPluginRegisteredWindowInstance";

export default interface IRaptorPluginRegisteredWindow {

    GetName(): string;
    CreateInstance(name: string, info: any): IRaptorPluginRegisteredWindowInstance;

}