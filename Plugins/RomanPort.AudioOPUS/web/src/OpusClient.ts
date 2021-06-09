import IRaptorPluginAudio from "../sdk/plugin/components/IRaptorPluginAudio";
import IRaptorPluginContext from "../sdk/plugin/IRaptorPluginContext";

export default class OpusClient implements IRaptorPluginAudio {

    constructor(context: IRaptorPluginContext) {
        this.context = context;
    }

    private context: IRaptorPluginContext;
    private initTask: Promise<void>;

    GetName(): string {
        return "OPUS Low Latency Audio";
    }

    async Start(): Promise<void> {
        this.initTask = this.InitAudio();
        await this.initTask;
    }

    async InitAudio(): Promise<void> {
        //Prepare audio
        this.audioContext = new AudioContext({
            sampleRate: 48000,
            latencyHint: "interactive"
        });

        await this.audioContext.audioWorklet.addModule(this.GetAudioWorkerAsDataURL());
        this.opusNode = new AudioWorkletNode(this.audioContext, 'OpusProcessor', {
            "outputChannelCount": [2]
        });
        this.opusNode.connect(this.audioContext.destination);

        //Set volume
        this.SetVolume(0);

        //Send wasm blob
        this.opusNode.port.postMessage({
            "op": "INIT",
            "payload": {
                "sampleRate": this.audioContext.sampleRate,
                "wasm": this.context.GetPackage("web").GetFile("libopus.wasm")
            }
        });

        //Get socket
        this.sock = this.context.conn.GetStream(this.context.GetId() + ".Stream")
            .AddQueryArgument("sample_rate", this.audioContext.sampleRate.toString())
            .AsWebSocket();

        //Bind
        this.sock.onmessage = (evt: MessageEvent) => {
            this.opusNode.port.postMessage({
                "op": "FRAME",
                "payload": new Uint8Array(evt.data)
            });
        }
    }

    async SetVolume(volume: number): Promise<void> {
        await this.initTask;
        if (this.opusNode != null) {
            this.opusNode.port.postMessage({
                "op": "VOLUME",
                "payload": volume
            });
        }
    }

    async Stop(): Promise<void> {
        await this.initTask;
        this.sock.close();
    }

    private GetAudioWorkerAsDataURL(): string {
        //Get data
        var arr = this.context.GetPackage("web").GetFileAsString("OpusAudioWorker.js");

        //Encode
        return "data:text/javascript;base64," + btoa(arr);
    }

    private audioContext: AudioContext;
    private opusNode: AudioWorkletNode;
    private sock: WebSocket;

}