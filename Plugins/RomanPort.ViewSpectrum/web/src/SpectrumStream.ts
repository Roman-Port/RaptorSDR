import IRaptorConnection from "../sdk/IRaptorConnection";
import RaptorEventDispaptcher from "../sdk/RaptorEventDispatcher";
import ISpectrumInfo from "./SpectrumInfo";

export default class SpectrumStream {

    constructor(conn: IRaptorConnection, info: ISpectrumInfo, hd: boolean) {
        //Configure
        this.hd = hd;
        this.SampleRateChanged = new RaptorEventDispaptcher();
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

    SampleRateChanged: RaptorEventDispaptcher<number>;
    FrameReceived: RaptorEventDispaptcher<Float32Array>;

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

    GetSampleRate(): number {
        return this.sampleRate;
    }

    WaitConnect(): Promise<void> {
        return this.connect;
    }

    private UpdateWebValue(key: string, value: any) {
        var e = {} as any;
        e[key] = value;
        this.WaitConnect().then(() => {
            this.sock.send(JSON.stringify(e));
        });
    }

    private OnFrame(payload: ArrayBuffer) {
        //Open DataView
        var view = new DataView(payload);

        //Check if sample rate has changed
        if (this.sampleRate != view.getUint32(0, true)) {
            this.sampleRate = view.getUint32(0, true);
            this.SampleRateChanged.Fire(this.sampleRate);
        }

        //Get number of pixels
        var size = (payload.byteLength - 4) / (this.hd ? 2 : 1);

        //Unpack
        var frame = new Float32Array(size);
        var offset = 4;
        if (this.hd) {
            //2 bytes-per-pixel, ushort
            for (var i = 0; i < size; i++) {
                frame[i] = view.getUint16(offset, true) / 65535;
                offset += 2;
            }
        } else {
            //1 byte-per-pixel
            for (var i = 0; i < size; i++) {
                frame[i] = view.getUint8(offset++) / 255;
            }
        }

        //Dispatch
        this.FrameReceived.Fire(frame);
    }

}