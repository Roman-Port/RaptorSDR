import IRaptorStream from "../../../sdk/web/IRaptorStream";
import RaptorConnection from "../RaptorConnection";

export default class RaptorStream implements IRaptorStream {

    constructor(conn: RaptorConnection, id: string) {
        this.conn = conn;
        this.id = id;
        this.query = [];
        this.AddQueryArgument("access_token", conn.token);
    }

    private conn: RaptorConnection;
    private id: string;
    private query: string[][];

    AddQueryArgument(key: string, value: string): IRaptorStream {
        this.query.push([key, value]);
        return this;
    }

    AsWebSocket(): WebSocket {
        var sock = new WebSocket(this.GetUrl("ws"));
        sock.binaryType = "arraybuffer";
        return sock;
    }

    private GetUrl(protocol: string): string {
        var url = this.conn.GetUrl(protocol, "/stream/" + this.id);
        for (var i = 0; i < this.query.length; i++) {
            url += (i == 0 ? "?" : "&");
            url += encodeURIComponent(this.query[i][0]);
            url += "=";
            url += encodeURIComponent(this.query[i][1]);
        }
        return url;
    }

}