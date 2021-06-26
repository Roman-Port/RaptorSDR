import IRaptorConfigurable from "../../sdk/misc/IRaptorConfigurable";
import RaptorEventDispatcher from "../../sdk/RaptorEventDispatcher";

export default class SpectrumDataProviderScaler implements IRaptorConfigurable<number> {

    constructor(baseProvider: IRaptorConfigurable<number>, scale: number) {
        this.baseProvider = baseProvider;
        this.scale = scale;

        this.baseProvider.OnChanged.Bind((value: number) => {
            this.OnChanged.Fire(Math.floor(value * this.scale));
        });
    }

    private baseProvider: IRaptorConfigurable<number>;
    private scale: number;

    GetValue(): number {
        return Math.floor(this.baseProvider.GetValue() * this.scale);
    }

    SetValue(value: number): Promise<any> {
        return this.baseProvider.SetValue(value / this.scale);
    }

    OnChanged: RaptorEventDispatcher<number> = new RaptorEventDispatcher();

}