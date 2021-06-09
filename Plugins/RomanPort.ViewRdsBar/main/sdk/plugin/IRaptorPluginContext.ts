import IRaptorConnection from "../IRaptorConnection";
import IRaptorWindow from "../ui/core/IRaptorWindow";
import RaptorMenuBuilder from "../ui/menu/RaptorMenuBuilder";
import IRaptorPluginPackage from "./IRaptorPluginPackage";
import IRaptorPluginRegisteredWindow from "./IRaptorPluginRegisteredWindow";

export default interface IRaptorPluginContext {
    conn: IRaptorConnection;

    GetName(): string;
    GetDeveloper(): string;
    GetId(): string;

    GetPackage(id: string): IRaptorPluginPackage;

    RegisterWindowClass(displayName: string, create: (info: any) => IRaptorWindow): IRaptorPluginRegisteredWindow;

    ShowMenu(menu: RaptorMenuBuilder): void;
}