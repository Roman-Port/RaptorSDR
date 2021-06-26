import IRaptorConnection from "../../sdk/IRaptorConnection";
import RaptorEventDispaptcher from "../../sdk/RaptorEventDispatcher";
import ISpectrumInfo from "../config/SpectrumInfo";
import ISpectrumFrame from "./ISpectrumFrame";

export default class SpectrumStream {

    constructor(conn: IRaptorConnection, info: ISpectrumInfo, hd: boolean) {
        //Configure
        this.hd = hd;
        this.FrameReceived = new RaptorEventDispaptcher();

        //Open stream
        this.sock = conn.GetStream(info.id)
            .AddQueryArgument("hd", hd.toString())
            .AsWebSocket();

        //Bind to socket
        this.sock.onmessage = (evt: MessageEvent) => {
            this.OnFrame(evt.data as ArrayBuffer);
        };

        //Wait for connection
        this.connect = new Promise((resolve, reject) => {
            this.sock.onopen = () => resolve();
            this.sock.onclose = () => reject();
        });
    }

    private sock: WebSocket;
    private hd: boolean;
    private sampleRate: number;
    private connect: Promise<void>;
    private currentToken: number = 0;

    private static readonly HEADER_SIZE: number = 8;

    FrameReceived: RaptorEventDispaptcher<ISpectrumFrame>;

    SetSize(size: number) {
        this.UpdateWebValue("size", size);
    }

    SetAttack(attack: number) {
        this.UpdateWebValue("attack", attack);
    }

    SetDecay(decay: number) {
        this.UpdateWebValue("decay", decay);
    }

    SetOffset(offset: number) {
        this.UpdateWebValue("offset", offset);
    }

    SetRange(range: number) {
        this.UpdateWebValue("range", range);
    }

    SetZoom(zoom: number) {
        this.UpdateWebValue("zoom", zoom);
    }

    WaitConnect(): Promise<void> {
        return this.connect;
    }

    IsTokenCurrent(challenge: number): boolean {
        return challenge == this.currentToken;
    }

    UpdateWebValue(key: string, value: any) {
        //Create payload
        var e = {} as any;
        e[key] = value;

        //Set token
        this.currentToken = (this.currentToken + 1) % 65535;
        e["token"] = this.currentToken;

        //Wait for connection and send
        this.WaitConnect().then(() => {
            this.sock.send(JSON.stringify(e));
        });
    }

    private OnFrame(payload: ArrayBuffer) {
        //Open DataView
        var view = new DataView(payload);

        //Read header
        var frame: ISpectrumFrame = {
            protocolVersion: view.getInt8(0),
            opcode: view.getInt8(1),
            token: view.getUint16(2, true),
            sampleRate: view.getUint32(4, true),
            frame: new Float32Array((payload.byteLength - SpectrumStream.HEADER_SIZE) / (this.hd ? 2 : 1))
        };

        //Unpack
        var offset = SpectrumStream.HEADER_SIZE;
        if (this.hd) {
            //2 bytes-per-pixel, ushort
            for (var i = 0; i < frame.frame.length; i++) {
                frame.frame[i] = view.getUint16(offset, true) / 65535;
                offset += 2;
            }
        } else {
            //1 byte-per-pixel
            for (var i = 0; i < frame.frame.length; i++) {
                frame.frame[i] = view.getUint8(offset++) / 255;
            }
        }

        //Dispatch
        this.FrameReceived.Fire(frame);
    }

}