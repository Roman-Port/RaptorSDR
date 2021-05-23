import RaptorInfoPluginFrontend from "../web/entities/info/RaptorInfoPluginFrontend";
import IRaptorPluginPackage from 'raptorsdr.web.common/src/plugin/IRaptorPluginPackage'

export default class RaptorPluginPackage implements IRaptorPluginPackage {

    constructor(info: RaptorInfoPluginFrontend, payload: ArrayBuffer) {
        this.info = info;
        this.payload = payload;

        //Parse
        var reader = new DataView(payload);
        if (reader.getUint32(0, true) != 1346786130) {
            throw new Error("Raptor frontend package is invalid or corrupt.");
        }
        var count = reader.getUint16(4, true);
        var version = reader.getUint16(6, true);
        if (version != 0) {
            throw new Error("Raptor frontend package is at an unknown version.");
        }

        //Read TOC
        this.items = {};
        var offset = 8;
        for (var i = 0; i < count; i++) {
            //Read type
            if (reader.getUint16(offset, true) != 19526) {
                throw new Error("Raptor frontend package contains unknown entry type.");
            }
            offset += 2;

            //Read name length
            var nameLen = reader.getUint16(offset, true);
            offset += 2;

            //Read name
            var name = "";
            for (var i = 0; i < nameLen; i++) {
                name += String.fromCharCode(reader.getUint8(offset++));
            }

            //Read payload length
            var len = reader.getUint32(offset, true);
            offset += 4;

            //Add
            this.items[name] = payload.slice(offset, offset + len);
            offset += len;
        }
    }

    private payload: ArrayBuffer;
    private info: RaptorInfoPluginFrontend;
    private items: { [key: string]: ArrayBuffer }

    GetName(): string {
        return this.info.name;
    }

    GetFile(key: string): ArrayBuffer {
        return this.items[key];
    }

    GetFileAsString(key: string): string {
        var decoder = new TextDecoder("utf-8");
        return decoder.decode(this.GetFile(key));
    }

}