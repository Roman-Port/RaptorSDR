import IRaptorPrimitiveDataProvider from "../web/providers/IRaptorPrimitiveDataProvider";
import IRaptorSelectableDataProvider from "../web/providers/IRaptorSelectableDataProvider";
import IRaptorRDS from "./IRaptorRDS";

export default interface IRaptorVFO {

    StereoDetected: IRaptorPrimitiveDataProvider<boolean>;
    RdsDetected: IRaptorPrimitiveDataProvider<boolean>;
    FreqOffset: IRaptorPrimitiveDataProvider<number>;
    Bandwidth: IRaptorPrimitiveDataProvider<number>;
    Demodulator: IRaptorSelectableDataProvider;
    RDS: IRaptorRDS;

}