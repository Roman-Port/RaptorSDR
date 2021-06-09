import RaptorEventDispaptcher from "../../RaptorEventDispatcher";
import IRaptorDataProvider from "../IRaptorDataProvider";

export default interface IRaptorPrimitiveDataProvider<T> extends IRaptorDataProvider {

	GetValue(): T;
	SetValue(value: T): Promise<any>;

	OnChanged: RaptorEventDispaptcher<T>;

}