import PiStateNames from "./PiStateNames";

export default class PiCodeEntry {

    constructor(view: DataView, offset: number) {
        this.len = view.getUint8(offset++);
        this.pi = view.getUint16(offset, true); offset += 2;
        this.callsign = PiCodeEntry.ReadString(view, offset); offset += this.callsign.length + 1;
        this.city = PiCodeEntry.ReadString(view, offset); offset += this.city.length + 1;
        this.stateIndex = view.getUint8(offset++);
        this.facilityId = view.getUint32(offset, true) & 16777215; offset += 3;
        this.lat = view.getFloat32(offset, true); offset += 4;
        this.lon = view.getFloat32(offset, true); offset += 4;
    }

    private len: number;
    private pi: number;
    private callsign: string;
    private city: string;
    private stateIndex: number;
    private facilityId: number;
    private lon: number;
    private lat: number;

    GetPiCode(): number {
        return this.pi;
    }

    GetCallsign(): string {
        return this.callsign;
    }

    GetCity(): string {
        return this.city;
    }

    GetStateShort(): string {
        return PiStateNames.STATES[this.stateIndex].s;
    }

    GetStateLong(): string {
        return PiStateNames.STATES[this.stateIndex].l;
    }

    GetFacilityId(): number {
        return this.facilityId;
    }

    GetLon(): number {
        return this.lon;
    }

    GetLat(): number {
        return this.lat;
    }

    private static ReadString(view: DataView, index: number): string {
        var length = view.getUint8(index);
        var output = "";
        for (var i = 0; i < length; i++) {
            output += String.fromCharCode(view.getUint8(index + 1 + i));
        }
        return output;
    }

}