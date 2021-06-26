import { SpectrumOpcode } from "./SpectrumOpcode";

export default interface ISpectrumFrame {

    protocolVersion: number;
    opcode: SpectrumOpcode;
    token: number;
    sampleRate: number;
    frame: Float32Array;

}