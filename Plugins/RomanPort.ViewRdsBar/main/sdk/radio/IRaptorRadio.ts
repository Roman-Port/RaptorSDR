import IRaptorPrimitiveDataProvider from "../web/providers/IRaptorPrimitiveDataProvider";
import IRaptorSelectableDataProvider from "../web/providers/IRaptorSelectableDataProvider";

export default interface IRaptorRadio {

    Power: IRaptorPrimitiveDataProvider<boolean>;
    CenterFreq: IRaptorPrimitiveDataProvider<number>;
    Source: IRaptorSelectableDataProvider;

}