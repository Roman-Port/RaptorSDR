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
import IRaptorDataProvider from "../../sdk/web/IRaptorDataProvider";
import RaptorDialogUtil from "./RaptorDialogUtil";
import RaptorMenuWindowStore from "./ui/core/xwindow/RaptorMenuWindowStore";
import RaptorEventDispaptcher from "../../sdk/RaptorEventDispatcher";
import RaptorOpenFileBrowser from "./ui/filebrowser/RaptorOpenFileBrowser";
import IRaptorSettingsRegion from "../../sdk/ui/setting/IRaptorSettingsRegion";
import RaptorSettingsPage from "./ui/core/setting/RaptorSettingsPage";
import { RaptorSettingsTab } from "../../sdk/ui/setting/RaptorSettingsTab";
import AuthError from "./errors/AuthError";
import IRaptorUserInfo from "./web/IRaptorUserInfo";

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
        this.rpcPing = this.rpc.CreateSubscription("PING");

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
    private rpcPing: IRaptorEndpoint;
    private rpc: RaptorDispatcherOpcode;

    private volume: number = 1;

    account: IRaptorUserInfo;
    token: string = localStorage.getItem("ACCESS_TOKEN");
    sessionId: string;
    Radio: IRaptorRadio;
    VFO: IRaptorVFO;
    dialog: RaptorDialogUtil = new RaptorDialogUtil(this);

    rpcDispatcherPlugin: RaptorDispatcherOpcode;
    rpcDispatcherDataProvider: RaptorDispatcherOpcode;

    plugins: RaptorPluginContext[];
    dataProviders: { [key: string]: IRaptorDataProvider };
    componentsAudio: IRaptorPluginAudio[] = [];

    currentAudio: IRaptorPluginAudio;

    OnAudioDeviceChanged: RaptorEventDispaptcher<IRaptorPluginAudio> = new RaptorEventDispaptcher<IRaptorPluginAudio>();
    OnAudioVolumeChanged: RaptorEventDispaptcher<number> = new RaptorEventDispaptcher<number>();

    GetUrl(protocol: string, path: string) {
        return protocol + "://" + this.rootUrl + path;
    }

    GetHttpRequest(path: string, method: string) {
        return new RaptorHttpRequestBuilder(this.GetUrl("http", path), method);
    }

    async GetInfo() {
        return await this.infoTask;
    }

    async Init(account: IRaptorUserInfo) {
        //Set
        this.account = account;

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
        this.rpcSock.OpenUrl(this.GetUrl("ws", "/rpc?encoding=JSON&access_token=" + this.token));

        //Wait for login to complete
        this.sessionId = await this.loginTask;

        //Init all plugins
        for (var i = 0; i < this.plugins.length; i++) {
            this.plugins[i].Init();
        }
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

    CreateFileOpenDialog(title: string): Promise<string> {
        return new Promise<string>((resolve) => {
            var browser = new RaptorOpenFileBrowser(this, title, (filename: string) => {
                resolve(filename);
            });
            browser.Show();
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

    RegisterSettingsRegionSidebar(region: IRaptorSettingsRegion, tab: RaptorSettingsTab) {
        this.app.settingStore.RegisterSidebarRegion(region, tab);
    }

    UnregisterSettingsRegion(region: IRaptorSettingsRegion) {
        this.app.settingStore.UnregisterRegion(region);
    }

    async EnableAudio(audio: IRaptorPluginAudio): Promise<void> {
        //Check if audio is already running
        if (this.currentAudio != null) { this.DisableAudio(); }

        //Set state
        this.currentAudio = audio;
        this.Log(RaptorLogLevel.DEBUG, "RaptorConnection", "Changed audio provider to " + this.currentAudio.GetName());

        //Start
        await this.currentAudio.Start();

        //Set default volume
        this.currentAudio.SetVolume(this.volume);

        //Send event
        this.OnAudioDeviceChanged.Fire(this.currentAudio);
    }

    async DisableAudio(): Promise<void> {
        //Check if audio is already running
        if (this.currentAudio == null) { return; }

        //Set state
        this.Log(RaptorLogLevel.DEBUG, "RaptorConnection", "Stopping current audio provider...");

        //Stop
        await this.currentAudio.Stop();
        this.currentAudio = null;

        //Send event
        this.OnAudioDeviceChanged.Fire(null);
    }

    GetAudioVolume(): number {
        return this.volume;
    }

    SetAudioVolume(volume: number) {
        this.volume = volume;
        if (this.currentAudio != null)
            this.currentAudio.SetVolume(this.volume);
        this.OnAudioVolumeChanged.Fire(this.volume);
    }

    GetAudioDevice(): IRaptorPluginAudio {
        return this.currentAudio;
    }

    async PingServer(): Promise<number> {
        var start = Date.now();
        await this.rpcPing.SendMessageGetResponse({});
        return Date.now() - start;
    }

    AuthRegister(username: string, password: string): Promise<IRaptorUserInfo> {
        return this.AuthUserCommand(username, password, "register");
    }

    AuthLogin(username: string, password: string): Promise<IRaptorUserInfo> {
        return this.AuthUserCommand(username, password, "login");
    }

    async AuthLogout(everywhere: boolean): Promise<void> {
        //Clear the stored token
        localStorage.removeItem("ACCESS_TOKEN");

        //If we requested to logout everywhere, send a command to invaidate the token
        if (everywhere) {
            //Create body
            var body = {
                "access_token": this.token
            };

            //Send
            await this.GetHttpRequest("/accounts/logout", "POST").SetBody(JSON.stringify(body)).AsJSON<any>();
        }

        //Reload
        window.location.reload();
    }

    AuthGetInfo(): Promise<IRaptorUserInfo> {
        //Create body
        var body = {
            "access_token": this.token
        };

        //Send
        return this.GetHttpRequest("/accounts/info", "POST").SetBody(JSON.stringify(body)).AsJSON<IRaptorUserInfo>();
    }

    private async AuthUserCommand(username: string, password: string, command: string): Promise<IRaptorUserInfo> {
        //Create body
        var body = {
            "username": username,
            "password": password
        };

        //Send
        var response = await this.GetHttpRequest("/accounts/" + command, "POST").SetBody(JSON.stringify(body)).AsJSON<any>();

        //Check status
        if (!response["ok"]) {
            throw new AuthError(response["status"]);
        }

        //Set access token
        localStorage.setItem("ACCESS_TOKEN", response["access_token"]);
        this.token = response["access_token"];

        //Return user info
        return response["info"] as IRaptorUserInfo;
    }

    CheckSystemScopeMask(mask: number): boolean {
        return this.account.admin || ((this.account.scope_system & mask) == mask);
    }

    CheckPluginScope(scope: string): boolean {
        return this.account.admin || this.account.scope_plugin.includes(scope);
    }

    CheckPluginScopes(scope: string[]): boolean {
        var ok = true;
        for (var i = 0; i < scope.length; i++)
            ok = ok && this.CheckPluginScope(scope[i]);
        return ok;
    }

}