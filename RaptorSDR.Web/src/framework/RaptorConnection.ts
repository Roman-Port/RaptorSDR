import IRaptorConnection from "raptorsdr.web.common/src/IRaptorConnection";
import RaptorWebsocket from "./web/RaptorWebsocket";
import RaptorWebsocketEndpoint from "./web/RaptorWebsocketEndpoint";
import RaptorDispatcherOpcode from 'raptorsdr.web.common/src/web/dispatchers/RaptorDispatcherOpcode';
import RaptorHttpRequestBuilder from 'raptorsdr.web.common/src/util/RaptorHttpRequestBuilder';
import RaptorInfo from "./web/entities/info/RaptorInfo";
import RaptorPluginContext from "./plugin/RaptorPluginContext";
import RaptorPluginPackageManager from "./plugin/RaptorPluginPackageManager";
import RaptorDataProvider from "./web/RaptorDataProvider";
import RaptorPrimitiveDataProvider from "./web/entities/providers/RaptorPrimitiveDataProvider";
import RaptorAuth from "./web/RaptorAuth";

export default class RaptorConnection implements IRaptorConnection {

    constructor(rootUrl: string) {
        //Configure
        this.rootUrl = rootUrl;

        //Get RPC set up
        this.rpcSock = new RaptorWebsocket(this.GetUrl("ws", "/rpc"));
        this.rpcSockEndpoint = new RaptorWebsocketEndpoint(this.rpcSock);
        this.rpc = new RaptorDispatcherOpcode(this.rpcSockEndpoint);
        this.rpcDispatcherPlugin = new RaptorDispatcherOpcode(this.rpc.CreateSubscription("PLUGIN"));
        this.rpcDispatcherDataProvider = new RaptorDispatcherOpcode(this.rpc.CreateSubscription("DATA_PROVIDER"));

        //Request info now
        this.infoTask = this.GetHttpRequest("/info", "GET")
            .AsJSON<RaptorInfo>();
    }

    private rootUrl: string;

    private infoTask: Promise<RaptorInfo>;

    private rpcSock: RaptorWebsocket;
    private rpcSockEndpoint: RaptorWebsocketEndpoint;
    private rpc: RaptorDispatcherOpcode;

    rpcDispatcherPlugin: RaptorDispatcherOpcode;
    rpcDispatcherDataProvider: RaptorDispatcherOpcode;

    plugins: RaptorPluginContext[];
    dataProviders: { [key: string]: RaptorDataProvider };
    token: string;

    GetUrl(protocol: string, path: string) {
        return protocol + "://" + this.rootUrl + path;
    }

    GetHttpRequest(path: string, method: string) {
        return new RaptorHttpRequestBuilder(this.GetUrl("http", path), method);
    }

    async GetInfo() {
        return await this.infoTask;
    }

    async AccountRegister(username: string, password: string): Promise<string> {
        this.token = await RaptorAuth.Register(this, username, password);
        return this.token;
    }

    async AccountLogin(username: string, password: string): Promise<string> {
        this.token = await RaptorAuth.Login(this, username, password);
        return this.token;
    }

    async Init() {
        //Get the info
        var info = await this.GetInfo();

        //Create data providers
        this.dataProviders = {};
        for (var i = 0; i < info.providers.length; i++) {
            var providerInfo = info.providers[i];
            var provider;
            switch (providerInfo.type) {
                case "RaptorSDR.Server.Common.DataProviders.RaptorPrimitiveDataProvider": provider = new RaptorPrimitiveDataProvider(this, providerInfo); break;
                default: provider = new RaptorDataProvider(this, providerInfo); break;
            }
            this.dataProviders[providerInfo.id] = provider;
        }

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

        //Init all plugins
        for (var i = 0; i < this.plugins.length; i++) {
            this.plugins[i].Init();
        }

        //Connect to sock
        this.rpcSock.OpenUrl(this.GetUrl("ws", "/rpc?access_token=" + this.token));
    }

}