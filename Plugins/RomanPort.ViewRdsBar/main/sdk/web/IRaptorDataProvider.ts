export default interface IRaptorDataProvider {

    GetName(): string;
    GetId(): string;
    GetType(): string;
    As<T>(): T;

}