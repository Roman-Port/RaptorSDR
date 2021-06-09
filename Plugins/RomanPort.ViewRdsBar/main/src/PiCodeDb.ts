import RaptorHttpRequestBuilder from "../sdk/util/RaptorHttpRequestBuilder";
import PiCodeEntry from "./PiCodeEntry";

export default class PiCodeDb {

	constructor() {
		this.init = this.Init();
	}

	private init: Promise<any>;
	private data: ArrayBuffer;
	private view: DataView;
	private toc: {[pi: number]: number} = {};

	async GetStationInfo(pi: number): Promise<PiCodeEntry> {
		//Wait for init to finish
		await this.init;

		//Search for this in the TOC
		if (this.toc[pi] == null) { return null; }

		//Create
		return new PiCodeEntry(this.view, this.toc[pi]);
	}

	private async Init() {
		//Make HTTP request
		this.data = await new RaptorHttpRequestBuilder("https://assets.romanport.com/static/PICODE_NORTH_AMERICA.bin", "GET")
			.AsArrayBuffer();

		//Make data view
		this.view = new DataView(this.data);

		//Build a "table of contents" of sorts where we can look up a byte offset by PI code
		//Scan just the PI codes and store them
		var offset = 0;
		while (offset + 2 <= this.view.byteLength) {
			var size = this.view.getUint8(offset);
			var pi = this.view.getUint16(offset + 1, true);
			this.toc[pi] = offset;
			offset += size;
		}
		(window as any).TOC = this;
	}

}