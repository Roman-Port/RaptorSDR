import IRaptorConfigurable from "../../sdk/misc/IRaptorConfigurable";
import RaptorEventDispatcher from "../../sdk/RaptorEventDispatcher";
import ISpectrumDataProviderHost from "./ISpectrumDataProviderHost";

export default class SpectrumDataProvider implements IRaptorConfigurable<number> {

    constructor(host: ISpectrumDataProviderHost, persistKey: string, sockKey: string, defaultValue: number) {
        //Configure
        this.host = host;
        this.persistKey = persistKey;
        this.sockKey = sockKey;
        this.persist = this.host.persist as any;

        //Make sure the persistent data is set
        if (this.persist[this.persistKey] == null)
            this.persist[this.persistKey] = defaultValue;

        //Update web value
        this.host.sock.UpdateWebValue(this.sockKey, this.GetValue());
    }

    SetAllowed(): boolean {
        return true;
    }

    private host: ISpectrumDataProviderHost;
    private persistKey: string;
    private sockKey: string;
    private persist: any;

    GetValue(): number {
        return this.persist[this.persistKey] as number;
    }

    async SetValue(value: number): Promise<any> {
        this.persist[this.persistKey] = value;
        this.host.sock.UpdateWebValue(this.sockKey, value);
        this.OnChanged.Fire(value);
        this.host.SettingsChanged();
    }

    OnChanged: RaptorEventDispatcher<number> = new RaptorEventDispatcher();

}