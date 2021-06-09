import IRaptorRadio from "./radio/IRaptorRadio";
import IRaptorVFO from "./radio/IRaptorVFO";
import IRaptorPrimitiveDataProvider from "./web/providers/IRaptorPrimitiveDataProvider";
import IRaptorSelectableDataProvider from "./web/providers/IRaptorSelectableDataProvider";

export default interface IRaptorConnection {

    GetDataProvider<T>(name: string): T;
    GetPrimitiveDataProvider<T>(name: string): IRaptorPrimitiveDataProvider<T>;
    GetSelectableDataProvider(name: string): IRaptorSelectableDataProvider;

    Radio: IRaptorRadio;
    VFO: IRaptorVFO;

}