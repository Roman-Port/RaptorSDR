import RaptorConnection from "../../../../RaptorConnection";
import SystemHeaderStatusIcon from "./SystemHeaderStatusIcon";

export default class SystemHeaderStatusIconNetwork extends SystemHeaderStatusIcon {

    constructor(container: HTMLElement, conn: RaptorConnection) {
        super(container, 0, 80, true, "rsys_headerstatus_icon_net", "ms");
        window.setInterval(() => {
            var timeout = window.setTimeout(() => {
                this.UpdateValue(1000);
            }, 900);
            conn.PingServer().then((delta: number) => {
                window.clearTimeout(timeout);
                this.UpdateValue(delta / 2);
            });
        }, 1000);
    }

}