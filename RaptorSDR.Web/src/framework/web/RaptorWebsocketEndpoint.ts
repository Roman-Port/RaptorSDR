import RaptorWebsocket from "./RaptorWebsocket";
import { Long, serialize, deserialize } from 'bson';
import IRaptorEndpoint from 'RaptorSdk/web/IRaptorEndpoint';
import RaptorEventDispaptcher from 'RaptorSdk/RaptorEventDispatcher';
import RaptorUtil from "../../../sdk/util/RaptorUtil";
import { RaptorBaseEndpoint } from "../../../sdk/web/RaptorBaseEndpoint";

export default class RaptorWebsocketEndpoint extends RaptorBaseEndpoint {

    constructor(sock: RaptorWebsocket) {
        super();
        this.sock = sock;
        sock.OnMessageBinary = (buffer: ArrayBuffer) => {
            var payload: any = deserialize(buffer);
            this.OnMessage.Fire(payload);
        };
    }

    SendMessage(message: any): void {
        var payload = serialize(message);
        this.sock.SendBinary(payload);
    }

    private sock: RaptorWebsocket;

}