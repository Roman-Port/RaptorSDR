import IRaptorMenu from "../../sdk/ui/menu/IRaptorMenu";
import RaptorMenuBuilder from "../../sdk/ui/menu/RaptorMenuBuilder";
import RaptorPanelBuilder from "../../sdk/ui/panel/RaptorPanelBuilder";
import RaptorConnection from "./RaptorConnection";

export default class RaptorDialogUtil {

    constructor(conn: RaptorConnection) {
        this.conn = conn;
    }

    private conn: RaptorConnection;

    private ShowBasicDialog(title: string, body: string, style: DialogStyle, width: number, height: number, buttonTrueStyle: DialogStyle, buttonTrueText: string, buttonFalseStyle: DialogStyle, buttonFalseText: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            var content = new RaptorPanelBuilder()
                .AddText(body);
            var dialog = new RaptorMenuBuilder(width, height)
                .SetContent(content.Build());
            switch (style) {
                case DialogStyle.NEGATIVE: dialog.SetTitleNegative(title); break;
                case DialogStyle.NEUTRAL: dialog.SetTitleNeutral(title); break;
                case DialogStyle.POSITIVE: dialog.SetTitlePositive(title); break;
            }
            RaptorDialogUtil.GetButtonFunction(dialog, buttonTrueStyle, resolve, buttonTrueText, true);
            RaptorDialogUtil.GetButtonFunction(dialog, buttonFalseStyle, resolve, buttonFalseText, false);
            this.conn.ShowMenu(dialog);
        });
    }

    private static GetButtonFunction(dialog: RaptorMenuBuilder, style: DialogStyle, resolve: (value: boolean) => void, text: string, value: boolean): void {
        switch (style) {
            case DialogStyle.NEGATIVE:
                dialog.NavBtnAddNegative(text, (menu: IRaptorMenu) => {
                    menu.Close();
                    resolve(value);
                });
                break;
            case DialogStyle.NEUTRAL:
                dialog.NavBtnAddNeutral(text, (menu: IRaptorMenu) => {
                    menu.Close();
                    resolve(value);
                });
                break;
            case DialogStyle.POSITIVE:
                dialog.NavBtnAddPositive(text, (menu: IRaptorMenu) => {
                    menu.Close();
                    resolve(value);
                });
                break;
        }
    }

    ShowYesNoDialogNegative(title: string, body: string, yesBtnText: string): Promise<boolean> {
        return this.ShowBasicDialog(title, body, DialogStyle.NEGATIVE,
            450, 250,
            DialogStyle.NEGATIVE, yesBtnText,
            DialogStyle.NEUTRAL, "Cancel");
    }

    ShowNegativeNotice(title: string, body: string, ackBtnText: string): Promise<void> {
        return new Promise<void>((resolve) => {
            var content = new RaptorPanelBuilder()
                .AddText(body);
            var dialog = new RaptorMenuBuilder(450, 250)
                .SetContent(content.Build())
                .SetTitleNegative(title)
                .NavBtnAddNeutral(ackBtnText, (menu: IRaptorMenu) => {
                    menu.Close();
                    resolve();
                });
            this.conn.ShowMenu(dialog);
        });
    }

}

enum DialogStyle {
    POSITIVE,
    NEUTRAL,
    NEGATIVE
}