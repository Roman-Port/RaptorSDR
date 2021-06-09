export default interface IRaptorPluginPackage {

    GetFile(key: string): ArrayBuffer;
    GetFileAsString(key: string): string;

}