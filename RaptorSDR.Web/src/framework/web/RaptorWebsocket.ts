export default class RaptorWebsocket {

    constructor(url: string) {
        this.url = url;
    }

    url: string;
    sock: WebSocket;

    OnConnected?: () => void;
    OnClosed?: () => void;
    OnMessageBinary?: (payload: ArrayBuffer) => void;
    OnMessageString?: (payload: string) => void;

    OpenUrl(url: string) {
        this.url = url;
        this.Open();
    }

    Open() {
        this.sock = new WebSocket(this.url);
        this.sock.binaryType = "arraybuffer";
        this.sock.addEventListener("open", (evt: Event) => {
            if (this.OnConnected != null) { this.OnConnected(); }
        });
        this.sock.addEventListener("close", (evt: Event) => {
            if (this.OnClosed != null) { this.OnClosed(); }
        });
        this.sock.addEventListener("message", (evt: MessageEvent) => {
            if (evt.data instanceof ArrayBuffer) {
                //Binary frame
                if (this.OnMessageBinary != null) { this.OnMessageBinary(evt.data); }
            } else {
                //Text frame
                if (this.OnMessageString != null) { this.OnMessageString(evt.data); }
            }
        });
    }

    SendBinary(payload: ArrayBuffer) {
        this.sock.send(payload);
    }

    SendString(payload: string) {
        this.sock.send(payload);
    }

}