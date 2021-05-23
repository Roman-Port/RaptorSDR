import RaptorUiUtil from "../../RaptorUiUtil";
import RaptorSystemTuner from "./freq/RaptorSystemTuner";

require("./header.css");
require("./buttons.css");

export default class RaptorSystemHeader {

    constructor(mount: HTMLElement) {
        //Create
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_header", mount);

        //Make buttons
        new SystemHeaderButtonBuilder("rsys_header_btn_play")
            .MakeAccent()
            .Build(this.mount);
        new SystemHeaderButtonBuilder("rsys_header_btn_sound")
            .Build(this.mount);
        new SystemHeaderButtonBuilder("e")
            .Build(this.mount);

        //Make tuner
        new RaptorSystemTuner(this.mount);
    }

    private mount: HTMLElement;

}

class SystemHeaderButtonBuilder {

    constructor(classname: string) {
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_header_button", null);
        this.clicker = RaptorUiUtil.CreateDom("div", "rsys_header_button_clicker", this.mount);
        this.mount.classList.add(classname);
    }

    private mount: HTMLElement;
    private clicker: HTMLElement;

    MakeAccent(): SystemHeaderButtonBuilder {
        this.mount.classList.add("rsys_header_button_accent");
        return this;
    }

    Build(container: HTMLElement) {
        container.appendChild(this.mount);
    }

}