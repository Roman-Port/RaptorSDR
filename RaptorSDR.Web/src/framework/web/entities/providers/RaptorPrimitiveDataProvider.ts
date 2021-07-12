import RaptorEventDispatcher from 'RaptorSdk/RaptorEventDispatcher';
import IRaptorEndpoint from 'RaptorSdk/web/IRaptorEndpoint';
import IRaptorPrimitiveDataProvider from 'RaptorSdk/web/providers/IRaptorPrimitiveDataProvider';
import RaptorUtil from 'RaptorSdk/util/RaptorUtil';
import RaptorConnection from '../../../RaptorConnection';
import RaptorDataProvider from '../../RaptorDataProvider';
import RaptorInfoProvider from '../info/RaptorInfoProvider';
import RaptorWebError from '../../../../../sdk/errors/RaptorWebError';

export default class RaptorPrimitiveDataProvider<T> extends RaptorDataProvider<T> implements IRaptorPrimitiveDataProvider<T> {

    constructor(conn: RaptorConnection, info: RaptorInfoProvider) {
        super(conn, info);
        this.OnChanged = this;
        this.endpointAck = this.endpoint.CreateSubscription("ACK");
        this.endpointSet = this.endpoint.CreateSubscription("SET_VALUE");
        this.endpointSet.OnMessage.Bind((payload: any) => {
            var value = payload["value"] as T;
            this.value = value;
            this.OnChanged.Fire(value);
        });
    }

    private value: T;
    protected endpointSet: IRaptorEndpoint;
    protected endpointAck: IRaptorEndpoint;

    Bind(callback: (payload: T) => any) {
        super.Bind(callback);
        callback(this.GetValue()); //automatically send to new clients
    }

    GetValue(): T {
        return this.value;
    }

    SetValue(value: T): Promise<any> {
        //Generate "token" that's used to get ACKs
        var token = RaptorUtil.GenerateRandomString(8);

        //Create promise
        var p = new Promise<any>((resolve, reject) => {
            this.endpointAck.OnMessage.Bind((message: any) => {
                if (message["token"] == token) {
                    if (message["ok"]) {
                        resolve(null);
                    } else {
                        reject(new RaptorWebError(message));
                    }
                    return true;
                }
            });
        });

        //Send message
        this.endpointSet.SendMessage({
            "value": value,
            "token": token
        });

        return p;
    }


    SetAllowed(): boolean {
        return !this.info.info["read_only"] && this.conn.CheckSystemScopeMask(this.info.info["scope_system"]) && this.conn.CheckPluginScopes(this.info.info["scope_plugin"]);
    }

    OnChanged: RaptorEventDispatcher<T>;

}