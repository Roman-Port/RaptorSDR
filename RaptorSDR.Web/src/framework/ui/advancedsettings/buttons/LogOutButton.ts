import AdvancedSettingsButton from "../AdvancedSettingsButton";
import AdvancedSettingsDialog from "../AdvancedSettingsDialog";
import { ButtonSections } from "../ButtonSections";

export default class LogOutButton extends AdvancedSettingsButton {

    constructor(dialog: AdvancedSettingsDialog) {
        super(dialog, "Log Out", ButtonSections.DANGER);
        this.MakeDangerous();
    }

    protected ButtonClicked() {
        this.dialog.conn.dialog.ShowYesNoDialogNegative("Log Out", "Are you sure you want to log out of RaptorSDR?", "Log Out").then((value: boolean) => {
            if (value) {
                this.dialog.conn.AuthLogout(false);
            }
        });
    }

}