import RaptorEventDispatcher from 'RaptorSdk/RaptorEventDispatcher';
import IRaptorEndpoint from 'RaptorSdk/web/IRaptorEndpoint';
import IRaptorPrimitiveDataProvider from 'RaptorSdk/web/providers/IRaptorPrimitiveDataProvider';
import RaptorUtil from 'RaptorSdk/util/RaptorUtil';
import RaptorConnection from '../../../RaptorConnection';
import RaptorDataProvider from '../../RaptorDataProvider';
import RaptorInfoProvider from '../info/RaptorInfoProvider';
import RaptorWebError from '../../../../../sdk/errors/RaptorWebError';

export default class RaptorPrimitiveDataProvider<T> extends RaptorDataProvider implements IRaptorPrimitiveDataProvider<T> {

    constructor(conn: RaptorConnection, info: RaptorInfoProvider) {
        super(conn, info);
        this.OnChanged = new RaptorEventDispatcher<T>();
        this.endpointAck = this.endpoint.CreateSubscription("ACK");
        this.endpointSet = this.endpoint.CreateSubscription("SET_VALUE");
        this.endpointSet.OnMessage.Bind((payload: any) => {
            //Check if we're the sender
            //if (payload["sender_id"] != null && payload["sender_id"] == conn.sessionId) { return; }

            //Process
            var value = payload["value"] as T;
            this.value = value;
            this.OnChanged.Fire(value);
        });
    }

    private value: T;
    protected endpointSet: IRaptorEndpoint;
    protected endpointAck: IRaptorEndpoint;

    GetValue(): T {
        return this.value;
    }

    SetValue(value: T): Promise<any> {
        //Generate "token" that's used to get ACKs
        var token = RaptorUtil.GenerateRandomString(8);

        //Set locally
        //this.value = value;
        //this.OnChanged.Fire(value);

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

    OnChanged: RaptorEventDispatcher<T>;

}