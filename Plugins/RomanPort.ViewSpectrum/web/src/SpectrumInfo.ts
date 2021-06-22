export default interface ISpectrumInfo {

    name: string;
    id: string;
    defaultOffset: number;
    defaultRange: number;
    defaultAttack: number;
    defaultDecay: number;
    fixedIncrement: number;
    useCenterFreq: boolean;
    freqDataProvider: string;

}