import RaptorEventDispatcher from 'raptorsdr.web.common/src/RaptorEventDispatcher';
import IRaptorEndpoint from 'raptorsdr.web.common/src/web/IRaptorEndpoint';
import IRaptorPrimitiveDataProvider from 'raptorsdr.web.common/src/web/providers/IRaptorPrimitiveDataProvider';
import RaptorUtil from 'raptorsdr.web.common/src/util/RaptorUtil';
import RaptorConnection from '../../../RaptorConnection';
import RaptorDataProvider from '../../RaptorDataProvider';
import RaptorInfoProvider from '../info/RaptorInfoProvider';

export default class RaptorPrimitiveDataProvider<T> extends RaptorDataProvider implements IRaptorPrimitiveDataProvider<T> {

    constructor(conn: RaptorConnection, info: RaptorInfoProvider) {
        super(conn, info);
        this.OnChanged = new RaptorEventDispatcher<T>();
        this.endpointAck = this.endpoint.CreateSubscription("ACK");
        this.endpointSet = this.endpoint.CreateSubscription("SET_VALUE");
        this.endpointSet.OnMessage.Bind((payload: any) => {
            //TODO: Check if the sender is ourselves so we can ignore our own messages
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
        this.value = value;

        //Create promise
        var p = new Promise<any>((resolve, reject) => {
            this.endpointAck.OnMessage.Bind((message: any) => {
                if (message["token"] == token) {
                    if (message["ok"]) {
                        resolve(null);
                    } else {
                        reject(message["error"]);
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