import IRaptorPrimitiveDataProvider from "../web/providers/IRaptorPrimitiveDataProvider";

export default interface IRaptorRDS {

    PiCode: IRaptorPrimitiveDataProvider<number>;
    PsBuffer: IRaptorPrimitiveDataProvider<string>;
    PsComplete: IRaptorPrimitiveDataProvider<string>;
    RtBuffer: IRaptorPrimitiveDataProvider<string>;
    RtComplete: IRaptorPrimitiveDataProvider<string>;

}