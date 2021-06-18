import RaptorWebsocket from "./RaptorWebsocket";
import IRaptorEndpoint from 'RaptorSdk/web/IRaptorEndpoint';
import RaptorEventDispaptcher from 'RaptorSdk/RaptorEventDispatcher';
import RaptorUtil from "../../../sdk/util/RaptorUtil";
import { RaptorBaseEndpoint } from "../../../sdk/web/RaptorBaseEndpoint";

export default class RaptorWebsocketEndpoint extends RaptorBaseEndpoint {

    constructor(sock: RaptorWebsocket) {
        super();
        this.sock = sock;
        sock.OnMessageString = (text: string) => {
            this.OnMessage.Fire(JSON.parse(text));
        };
    }

    SendMessage(message: any): void {
        this.sock.SendString(JSON.stringify(message));
    }

    private sock: RaptorWebsocket;

}