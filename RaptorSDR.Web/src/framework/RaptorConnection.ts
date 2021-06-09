import IRaptorConnection from "RaptorSdk/IRaptorConnection";
import RaptorWebsocket from "./web/RaptorWebsocket";
import RaptorWebsocketEndpoint from "./web/RaptorWebsocketEndpoint";
import RaptorDispatcherOpcode from 'RaptorSdk/web/dispatchers/RaptorDispatcherOpcode';
import RaptorHttpRequestBuilder from 'RaptorSdk/util/RaptorHttpRequestBuilder';
import RaptorInfo from "./web/entities/info/RaptorInfo";
import RaptorPluginContext from "./plugin/RaptorPluginContext";
import RaptorPluginPackageManager from "./plugin/RaptorPluginPackageManager";
import RaptorDataProvider from "./web/RaptorDataProvider";
import RaptorPrimitiveDataProvider from "./web/entities/providers/RaptorPrimitiveDataProvider";
import RaptorAuth from "./web/RaptorAuth";
import RaptorSelectableDataProvider from "./web/entities/providers/RaptorSelectableDataProvider";
import IRaptorPrimitiveDataProvider from "RaptorSdk/web/providers/IRaptorPrimitiveDataProvider";
import IRaptorSelectableDataProvider from "RaptorSdk/web/providers/IRaptorSelectableDataProvider";
import IRaptorRadio from "RaptorSdk/radio/IRaptorRadio";
import IRaptorVFO from "RaptorSdk/radio/IRaptorVFO";
import IRaptorRDS from "RaptorSdk/radio/IRaptorRDS";
import RaptorApp from "../RaptorApp";
import RaptorMenuBuilder from "../../sdk/ui/menu/RaptorMenuBuilder";
import IRaptorMenu from "../../sdk/ui/menu/IRaptorMenu";
import IRaptorEndpoint from "../../sdk/web/IRaptorEndpoint";
import RootListing from "./web/entities/file/RootListing";
import DirectoryListing from "./web/entities/file/DirectoryListing";
import RaptorFileBrowser from "./ui/filebrowser/RaptorFileBrowser";
import RaptorSaveFileBrowser from "./ui/filebrowser/RaptorSaveFileBrowser";
import FileAccessInfo from "./web/entities/file/FileAccessInfo";
import RaptorPanelBuilder from "../../sdk/ui/panel/RaptorPanelBuilder";
import RaptorStream from "./web/RaptorStream";
import IRaptorStream from "../../sdk/web/IRaptorStream";
import IRaptorPluginAudio from "../../sdk/plugin/components/IRaptorPluginAudio";
import { RaptorLogLevel } from "../../sdk/RaptorLogLevel";

export default class RaptorConnection implements IRaptorConnection {

    constructor(app: RaptorApp, rootUrl: string) {
        //Configure
        this.app = app;
        this.rootUrl = rootUrl;

        //Get RPC set up
        this.rpcSock = new RaptorWebsocket(this.GetUrl("ws", "/rpc"));
        this.rpcSockEndpoint = new RaptorWebsocketEndpoint(this.rpcSock);
        this.rpc = new RaptorDispatcherOpcode(this.rpcSockEndpoint);
        this.rpcDispatcherPlugin = new RaptorDispatcherOpcode(this.rpc.CreateSubscription("PLUGIN"));
        this.rpcDispatcherDataProvider = new RaptorDispatcherOpcode(this.rpc.CreateSubscription("DATA_PROVIDER"));
        this.rpcSockFileDrives = this.rpc.CreateSubscription("FILE_GET_ROOTS");
        this.rpcSockFileListing = this.rpc.CreateSubscription("FILE_DIR_LISTING");
        this.rpcSockFileAccess = this.rpc.CreateSubscription("FILE_CHECK_ACCESS");

        //Request info now
        this.infoTask = this.GetHttpRequest("/info", "GET")
            .AsJSON<RaptorInfo>();
    }

    app: RaptorApp;
    private rootUrl: string;

    private infoTask: Promise<RaptorInfo>;
    private loginTask: Promise<string>;

    private rpcSock: RaptorWebsocket;
    private rpcSockEndpoint: RaptorWebsocketEndpoint;
    private rpcSockFileDrives: IRaptorEndpoint;
    private rpcSockFileListing: IRaptorEndpoint;
    private rpcSockFileAccess: IRaptorEndpoint;
    private rpc: RaptorDispatcherOpcode;

    token: string;
    sessionId: string;
    volume: number = 1;
    Radio: IRaptorRadio;
    VFO: IRaptorVFO;

    rpcDispatcherPlugin: RaptorDispatcherOpcode;
    rpcDispatcherDataProvider: RaptorDispatcherOpcode;

    plugins: RaptorPluginContext[];
    dataProviders: { [key: string]: RaptorDataProvider };
    componentsAudio: IRaptorPluginAudio[] = [];

    currentAudio: IRaptorPluginAudio;

    GetUrl(protocol: string, path: string) {
        return protocol + "://" + this.rootUrl + path;
    }

    GetHttpRequest(path: string, method: string) {
        return new RaptorHttpRequestBuilder(this.GetUrl("http", path), method);
    }

    async GetInfo() {
        return await this.infoTask;
    }

    async Init(token: string) {
        //Set
        this.token = token;

        //Get the info
        var info = await this.GetInfo();

        //Create data providers
        this.dataProviders = {};
        for (var i = 0; i < info.providers.length; i++) {
            var providerInfo = info.providers[i];
            var provider;
            switch (providerInfo.type) {
                case "RaptorSDR.Server.Common.DataProviders.RaptorPrimitiveDataProvider": provider = new RaptorPrimitiveDataProvider(this, providerInfo); break;
                case "RaptorSDR.Server.Common.DataProviders.RaptorSelectionDataProvider": provider = new RaptorSelectableDataProvider(this, providerInfo); break;
                default: provider = new RaptorDataProvider(this, providerInfo); break;
            }
            this.dataProviders[providerInfo.id] = provider;
        }

        //Create bits
        this.Radio = this.HelperCreateProviderWrapper<IRaptorRadio>("RaptorSDR.Radio.");
        this.VFO = this.HelperCreateProviderWrapper<IRaptorVFO>("RaptorSDR.VFO.");
        this.VFO.RDS = this.HelperCreateProviderWrapper<IRaptorRDS>("RaptorSDR.VFO.RDS.");

        //Load plugins
        this.plugins = [];
        for (var i = 0; i < info.plugins.length; i++) {
            this.plugins.push(new RaptorPluginContext(info.plugins[i], this));
        }

        //Load plugin frontends
        await RaptorPluginPackageManager.LoadPackages(this, this.plugins);

        //Instantiate all plugins
        for (var i = 0; i < this.plugins.length; i++) {
            this.plugins[i].Instantiate();
        }

        //Bind completed endpoint to socket
        this.loginTask = new Promise((resolve, reject) => {
            this.rpcSockEndpoint.OnMessage.Bind((payload: any) => {
                if (payload.op == "LOGIN_COMPLETED") {
                    resolve(payload.d["session_id"]);
                }
            });
        });

        //Connect to sock
        this.rpcSock.OpenUrl(this.GetUrl("ws", "/rpc?access_token=" + this.token));

        //Wait for login to complete
        this.sessionId = await this.loginTask;

        //Init all plugins
        for (var i = 0; i < this.plugins.length; i++) {
            this.plugins[i].Init();
        }

        //Start default audio for testing purposes
        this.EnableAudio(this.componentsAudio[0]);
    }

    GetDataProvider<T>(name: string): T {
        return this.dataProviders[name] as unknown as T;
    }

    GetPrimitiveDataProvider<T>(name: string): IRaptorPrimitiveDataProvider<T> {
        return this.GetDataProvider(name) as IRaptorPrimitiveDataProvider<T>;
    }

    GetSelectableDataProvider(name: string): IRaptorSelectableDataProvider {
        return this.GetDataProvider(name) as IRaptorSelectableDataProvider;
    }

    GetStream(id: string): IRaptorStream {
        return new RaptorStream(this, id);
    }

    ShowMenu(builder: RaptorMenuBuilder): IRaptorMenu {
        return this.app.menuMount.BuildShowMenu(builder);
    }

    private HelperCreateProviderWrapper<T>(prefix: string) {
        var output = {} as any;
        var k = Object.keys(this.dataProviders);
        for (var i = 0; i < k.length; i++) {
            if (!k[i].startsWith(prefix)) { continue; } //Make sure it starts with our prefix
            var key = k[i].substr(prefix.length); //Get key without prefix
            if (key.includes(".")) { continue; } //Don't include children
            output[key] = this.dataProviders[k[i]];
        }
        return output as T;
    }

    async IoGetRoots(): Promise<RootListing> {
        var response = await this.rpcSockFileDrives.SendMessageGetResponse({});
        return response as RootListing;
    }

    async IoGetFileAccessInfo(path: string): Promise<FileAccessInfo> {
        var response = await this.rpcSockFileAccess.SendMessageGetResponse({ "path": path });
        return response as FileAccessInfo;
    }

    async IoGetDirListing(path: string): Promise<DirectoryListing> {
        //Get
        var response = (await this.rpcSockFileListing.SendMessageGetResponse({ "path": path })) as DirectoryListing;

        //Generate full names. A bit of a hack.
        for (var i = 0; i < response.list.length; i++) {
            response.list[i].fullName = path + "/" + response.list[i].name;
        }

        return response;
    }

    CreateFileSaveDialog(title: string): Promise<string> {
        return new Promise<string>((resolve) => {
            var browser = new RaptorSaveFileBrowser(this, title, (filename: string) => {
                resolve(filename);
            });
            browser.Show();
        });
    }

    ShowErrorDialog(title: string, body: string): Promise<void> {
        return new Promise<void>((resolve) => {
            var menu: IRaptorMenu;
            var content = new RaptorPanelBuilder()
                .AddText(body);
            var dialog = new RaptorMenuBuilder(450, 200)
                .SetTitleNegative(title)
                .SetContent(content.Build())
                .NavBtnAddNeutral("Okay", () => {
                    menu.Close();
                    resolve();
                });
            menu = this.ShowMenu(dialog);
        });
    }

    ShowYesNoDialogNegative(title: string, body: string, yesBtnText: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            var menu: IRaptorMenu;
            var content = new RaptorPanelBuilder()
                .AddText(body);
            var dialog = new RaptorMenuBuilder(450, 200)
                .SetTitleNegative(title)
                .SetContent(content.Build())
                .NavBtnAddNeutral("Cancel", () => {
                    menu.Close();
                    resolve(false);
                })
                .NavBtnAddNegative(yesBtnText, () => {
                    menu.Close();
                    resolve(true);
                });
            menu = this.ShowMenu(dialog);
        });
    }

    Log(level: RaptorLogLevel, topic: string, message: string): void {
        console.log("[" + level.toString().padStart(5, " ") + "] [" + topic + "] " + message);
    }

    RegisterComponentAudio(plugin: RaptorPluginContext, audio: IRaptorPluginAudio): void {
        //Log
        this.Log(RaptorLogLevel.LOG, "RaptorConnection", "Registered audio interface \"" + audio.GetName() + "\" from plugin \"" + plugin.GetId() + "\""); 

        //Add
        this.componentsAudio.push(audio);
    }

    EnableAudio(audio: IRaptorPluginAudio) {
        //Set state
        this.currentAudio = audio;
        this.Log(RaptorLogLevel.DEBUG, "RaptorConnection", "Changed audio provider to " + this.currentAudio.GetName());

        //Start
        this.currentAudio.Start();

        //Set default volume
        this.currentAudio.SetVolume(this.volume);
    }

}