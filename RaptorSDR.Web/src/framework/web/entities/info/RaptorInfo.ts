import RaptorInfoPlugin from "./RaptorInfoPlugin";
import RaptorInfoProvider from "./RaptorInfoProvider";

export default class RaptorInfo {

    status: string;
    version_major: number;
    version_minor: number;
    plugins: RaptorInfoPlugin[];
    providers: RaptorInfoProvider[];

}