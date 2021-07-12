import IRaptorConnection from "../sdk/IRaptorConnection";
import IRaptorSettingsComponent from "../sdk/ui/setting/IRaptorSettingsComponent";
import RaptorSettingsRegionBuilder from "../sdk/ui/setting/RaptorSettingsRegionBuilder";
import { RaptorSettingsTab } from "../sdk/ui/setting/RaptorSettingsTab";
import RaptorUiUtil from "../sdk/util/RaptorUiUtil";
import RaptorDispatcherOpcode from "../sdk/web/dispatchers/RaptorDispatcherOpcode";
import IRaptorEndpoint from "../sdk/web/IRaptorEndpoint";
import IRaptorPrimitiveDataProvider from "../sdk/web/providers/IRaptorPrimitiveDataProvider";
import IRecorderSettings from "./IRecorderSettings";
import RecorderPlugin from "./RecorderPlugin";
import IRecorderBtn from "./ui/IRecorderBtn";
import IRecorderControl from "./ui/IRecorderControl";
import IRecorderControlContainer from "./ui/IRecorderControlContainer";

require("./style.css");

export default class RecorderSession implements IRaptorSettingsComponent {

    constructor(plugin: RecorderPlugin, conn: IRaptorConnection, settings: IRecorderSettings, endpoint: IRaptorEndpoint) {
        //Configure
        this.plugin = plugin;
        this.conn = conn;
        this.settings = settings;

        //Get RPC endpoints
        this.rpcDispatcher = new RaptorDispatcherOpcode(endpoint);
        this.rpcEpStart = this.rpcDispatcher.CreateSubscription("RECORDING_START");
        this.rpcEpStop = this.rpcDispatcher.CreateSubscription("RECORDING_STOP");
        this.rpcEpCancel = this.rpcDispatcher.CreateSubscription("RECORDING_CANCEL");

        //Get data providers
        this.status = this.conn.GetPrimitiveDataProvider<string>("RaptorSDR.RomanPort.Recorder." + this.settings.id + ".Status");
        this.duration = this.conn.GetPrimitiveDataProvider<number>("RaptorSDR.RomanPort.Recorder." + this.settings.id + ".Duration");
        this.size = this.conn.GetPrimitiveDataProvider<number>("RaptorSDR.RomanPort.Recorder." + this.settings.id + ".Size");

        //Bind
        this.status.OnChanged.Bind(() => this.UpdateAllControls());
        this.duration.OnChanged.Bind(() => this.UpdateAllControls());
        this.size.OnChanged.Bind(() => this.UpdateAllControls());

        //Register menu
        var builder = new RaptorSettingsRegionBuilder(settings.name, settings.id, conn)
            .AddOptionCustom(this)
            .Build();
        conn.RegisterSettingsRegionSidebar(builder, RaptorSettingsTab.EXTRA);
    }

    private plugin: RecorderPlugin;
    private conn: IRaptorConnection;
    private settings: IRecorderSettings;
    private controls: IRecorderControl[] = [];

    private rpcDispatcher: RaptorDispatcherOpcode;
    private rpcEpStart: IRaptorEndpoint;
    private rpcEpStop: IRaptorEndpoint;
    private rpcEpCancel: IRaptorEndpoint;

    private status: IRaptorPrimitiveDataProvider<string>;
    private duration: IRaptorPrimitiveDataProvider<number>;
    private size: IRaptorPrimitiveDataProvider<number>;

    Build(): HTMLElement {
        //Make container
        var container = RaptorUiUtil.CreateDom("div") as HTMLElement as IRecorderControlContainer;

        //Create status region
        var status = RaptorUiUtil.CreateDom("div", "rplug_recorder_status", container);
        var led = RaptorUiUtil.CreateDom("div", "rplug_recorder_status_led", status);
        var text = RaptorUiUtil.CreateDom("div", "rplug_recorder_status_text", status);

        //Create bars
        var bars = RaptorUiUtil.CreateDom("div", "rplug_recorder_control", container);
        var carousel = RaptorUiUtil.CreateDom("div", "rplug_recorder_control_carousel", bars);
        carousel.addEventListener("mousedown", (evt) => evt.preventDefault());

        //Create idle bar
        var record = RaptorUiUtil.CreateDom("div", "rplug_recorder_control_bar", carousel).AddClass("rplug_recorder_control_bar_record");
        for (var i = 0; i < 3; i++)
            this.CreateRecorderBtn(record, this.settings.rewind_buffer_seconds / Math.pow(2, i));
        this.CreateRecorderBtn(record, 0, "RECORD");

        //Create record bar
        var stopBar = RaptorUiUtil.CreateDom("div", "rplug_recorder_control_bar", carousel);
        RaptorUiUtil.CreateDom("div", null, stopBar).SetText("Cancel").addEventListener("click", () => this.CancelRecording());
        RaptorUiUtil.CreateDom("div", null, stopBar).SetText("Stop").addEventListener("click", () => this.StopRecording());

        //Make control
        var control: IRecorderControl = {
            statusText: text,
            statusLed: led,
            carousel: carousel
        };

        //Apply control
        container.xraptor_recorder_control = control;
        this.UpdateControl(control);
        this.controls.push(control);

        return container;
    }

    Destroy(element: HTMLElement): void {
        //Remove the control
        this.controls.splice(this.controls.indexOf((element as IRecorderControlContainer).xraptor_recorder_control));

        //Delete element
        element.remove();
    }

    private CreateRecorderBtn(container: HTMLElement, value: number, customText?: string): IRecorderBtn {
        var btn = RaptorUiUtil.CreateDom("div", null, container) as HTMLElement as IRecorderBtn;
        btn.xraptor_recorder_time = value;
        btn.innerText = customText == null ? value + "s+" : customText;
        btn.addEventListener("click", (evt: MouseEvent) => {
            this.StartRecording((evt.currentTarget as IRecorderBtn).xraptor_recorder_time);
            evt.preventDefault();
            evt.stopPropagation();
        });
        return btn;
    }

    private UpdateAllControlsLoading() {
        for (var i = 0; i < this.controls.length; i++)
            this.controls[i].carousel.classList.add("rplug_recorder_control_loader");
    }

    private UpdateAllControls() {
        for (var i = 0; i < this.controls.length; i++)
            this.UpdateControl(this.controls[i]);
    }

    private UpdateControl(control: IRecorderControl) {
        //Determine
        var color: string;
        var text: string;
        var bar: number;
        var loading: boolean;
        switch (this.status.GetValue()) {
            case "IDLE":
                color = "#444446";
                text = "Ready.";
                bar = 0;
                loading = false;
                break;
            case "RECORDING":
                color = "#f75757";
                text = "Recording...";
                bar = 1;
                loading = false;
                break;
            case "STOPPING":
                color = "#f79257";
                text = "Stopping...";
                bar = 1;
                loading = true;
                break;
            default:
                console.warn("RecorderSession: Unknown status.");
                break;
        }

        //Format time
        var time = this.duration.GetValue();
        var timeString = Math.floor(time / 60 / 60).toString().padStart(2, '0') + ":" + Math.floor((time / 60) % 60).toString().padStart(2, '0') + ":" + Math.floor(time % 60).toString().padStart(2, '0');

        //Get size
        var sizeString = Math.floor(this.size.GetValue() / 1000) + " MB";

        //Apply
        control.statusText.innerText = timeString + " - " + sizeString;
        control.statusLed.style.background = color;
        control.carousel.style.top = (-30 * bar) + "px";
        if (loading)
            control.carousel.classList.add("rplug_recorder_control_loader");
        else
            control.carousel.classList.remove("rplug_recorder_control_loader");
    }

    private StartRecording(seconds: number) {
        this.UpdateAllControlsLoading();
        this.rpcEpStart.SendMessage({
            seconds: seconds
        });
    }

    private StopRecording() {
        this.UpdateAllControlsLoading();
        this.conn.CreateFileSaveDialog("Save File").then((path: string) => {
            if (path != null) {
                this.rpcEpStop.SendMessage({
                    output: path
                });
            }
        });
    }

    private CancelRecording() {
        this.UpdateAllControlsLoading();
        this.rpcEpCancel.SendMessage({
        });
    }

}