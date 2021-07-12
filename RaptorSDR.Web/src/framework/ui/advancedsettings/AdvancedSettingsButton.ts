import RaptorUiUtil from "../../../../sdk/util/RaptorUiUtil";
import AdvancedSettingsDialog from "./AdvancedSettingsDialog";

export default class AdvancedSettingsButton {

    constructor(dialog: AdvancedSettingsDialog, text: string, section: number) {
        this.dialog = dialog;
        this.button = RaptorUiUtil.CreateDom("div", "rsys_asettings_sidebar_btn", this.dialog.GetSidebarSection(section)).SetText(text);
        this.button.addEventListener("click", (evt: MouseEvent) => {
            this.ButtonClicked();
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    protected dialog: AdvancedSettingsDialog;

    private button: HTMLElement;

    SetActive(active: boolean) {
        if (active)
            this.button.classList.add("rsys_asettings_sidebar_btn_active");
        else
            this.button.classList.remove("rsys_asettings_sidebar_btn_active");
    }

    protected ButtonClicked() {
        this.dialog.DeactivateAll();
        this.SetActive(true);
    }

    protected MakeDangerous() {
        this.button.classList.add("rsys_asettings_sidebar_btn_danger");
    }

}