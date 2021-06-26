import ISpectrumPersistSettings from "../misc/ISpectrumPersistSettings";
import SpectrumStream from "../web/SpectrumStream";

export default interface ISpectrumDataProviderHost {

    persist: ISpectrumPersistSettings;
    sock: SpectrumStream;

    SettingsChanged(): void;

}