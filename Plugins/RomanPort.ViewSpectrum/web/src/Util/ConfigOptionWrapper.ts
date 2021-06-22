import IRaptorConfigurable from "../../sdk/misc/IRaptorConfigurable";
import RaptorEventDispatcher from "../../sdk/RaptorEventDispatcher";
import SpectrumWindow from "../SpectrumWindow";

export default class ConfigOptionWrapper implements IRaptorConfigurable<number> {

    constructor(window: SpectrumWindow, configKey: string, callback: (value: number) => void, scale?: number) {
        this.window = window;
        this.configKey = configKey;
        this.callback = callback;
        this.scale = scale == null ? 1 : scale;
    }

    private window: SpectrumWindow;
    private configKey: string;
    private callback: (value: number) => void;
    private scale: number;

    GetValue(): number {
        return (this.window.persist as any)[this.configKey] * this.scale;
    }

    async SetValue(value: number): Promise<any> {
        value /= this.scale;
        (this.window.persist as any)[this.configKey] = value;
        this.callback(value);
        this.window.SettingsChanged();
        this.OnChanged.Fire(value);
    }

    OnChanged: RaptorEventDispatcher<number> = new RaptorEventDispatcher();
}