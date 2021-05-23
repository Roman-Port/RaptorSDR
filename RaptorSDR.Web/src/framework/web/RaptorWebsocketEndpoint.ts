import RaptorWebsocket from "./RaptorWebsocket";
import { Long, serialize, deserialize } from 'bson';
import IRaptorEndpoint from 'raptorsdr.web.common/src/web/IRaptorEndpoint';
import RaptorEventDispaptcher from 'raptorsdr.web.common/src/RaptorEventDispatcher';

export default class RaptorWebsocketEndpoint implements IRaptorEndpoint {

    constructor(sock: RaptorWebsocket) {
        this.sock = sock;
        this.OnMessage = new RaptorEventDispaptcher<any>();
        sock.OnMessageBinary = (buffer: ArrayBuffer) => {
            var payload: any = deserialize(buffer);
            console.log(payload);
            this.OnMessage.Fire(payload);
        };
    }

    SendMessage(message: any): void {
        var payload = serialize(message);
        this.sock.SendBinary(payload);
    }

    OnMessage: RaptorEventDispaptcher<any>;

    private sock: RaptorWebsocket;

}