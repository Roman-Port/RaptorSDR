import IRaptorConnection from "../IRaptorConnection";
import RaptorMenuBuilder from "../ui/menu/RaptorMenuBuilder";
import IRaptorPluginPackage from "./IRaptorPluginPackage";

export default interface IRaptorPluginContext {
    conn: IRaptorConnection;

    GetName(): string;
    GetDeveloper(): string;
    GetId(): string;

    GetPackage(id: string): IRaptorPluginPackage;

    ShowMenu(menu: RaptorMenuBuilder): void;
}