import RaptorEventDispaptcher from "../../RaptorEventDispatcher";
import IRaptorDataProvider from "../IRaptorDataProvider";
import IRaptorPrimitiveDataProvider from "./IRaptorPrimitiveDataProvider";

export default interface IRaptorSelectableDataProvider extends IRaptorPrimitiveDataProvider<string> {

	GetOptions(): string[];

}