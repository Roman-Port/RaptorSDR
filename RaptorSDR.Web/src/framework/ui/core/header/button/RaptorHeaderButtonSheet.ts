export default class RaptorHeaderButtonSheet {

    constructor(mount: HTMLElement) {
        this.mount = mount;
        this.mount.classList.add("rsys_header_sheet");
    }

    private mount: HTMLElement;

    AddButton(btn: HTMLElement) {
        this.mount.appendChild(btn);
    }

}