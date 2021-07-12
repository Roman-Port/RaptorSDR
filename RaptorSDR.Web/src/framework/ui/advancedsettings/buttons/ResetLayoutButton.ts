import AdvancedSettingsButton from "../AdvancedSettingsButton";
import AdvancedSettingsDialog from "../AdvancedSettingsDialog";
import { ButtonSections } from "../ButtonSections";

export default class ResetLayoutButton extends AdvancedSettingsButton {

    constructor(dialog: AdvancedSettingsDialog) {
        super(dialog, "Reset Layout", ButtonSections.DANGER);
        this.MakeDangerous();
    }

    protected ButtonClicked() {
        this.dialog.conn.dialog.ShowYesNoDialogNegative("Reset Layout", "Are you sure you want to clear your layout settings to default? You'll have to reconfigure the main view again.", "Reset").then((value: boolean) => {
            if (value) {
                localStorage.removeItem("RAPTOR_WINDOW_LAYOUT");
                window.location.reload();
            }
        });
    }

}