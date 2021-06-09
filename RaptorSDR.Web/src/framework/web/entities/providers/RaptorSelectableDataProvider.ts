import RaptorConnection from "../../../RaptorConnection";
import RaptorInfoProvider from "../info/RaptorInfoProvider";
import RaptorPrimitiveDataProvider from "./RaptorPrimitiveDataProvider";
import IRaptorSelectableDataProvider from 'RaptorSdk/web/providers/IRaptorSelectableDataProvider';

export default class RaptorSelectableDataProvider extends RaptorPrimitiveDataProvider<string> implements IRaptorSelectableDataProvider {

    constructor(conn: RaptorConnection, info: RaptorInfoProvider) {
        super(conn, info);
        this.options = info.info["options"] as unknown as string[];
    }

    private options: string[];

    GetOptions(): string[] {
        return this.options;
    }

}