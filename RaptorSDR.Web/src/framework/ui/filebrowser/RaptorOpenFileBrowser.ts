import IRaptorMenu from "../../../../sdk/ui/menu/IRaptorMenu";
import RaptorMenuBuilder from "../../../../sdk/ui/menu/RaptorMenuBuilder";
import { RaptorMenuButtonStatus } from "../../../../sdk/ui/menu/RaptorMenuButtonStatus";
import RaptorConnection from "../../RaptorConnection";
import RaptorFileBrowser from "./RaptorFileBrowser";

export default class RaptorOpenFileBrowser extends RaptorFileBrowser {

    constructor(conn: RaptorConnection, name: string, callback: (pathname: string) => void) {
        super(conn, name);
        this.callback = callback;
    }

    private builder: RaptorMenuBuilder;
    private callback: (pathname: string) => void;
    private currentFilename: string;
    private currentFilenameValid: boolean;

    protected BuildDialog(builder: RaptorMenuBuilder) {
        super.BuildDialog(builder);
        this.builder = builder;
        builder.NavBtnAddNeutral("Cancel", (menu: IRaptorMenu) => {
            this.callback(null);
            menu.Close();
        });
        builder.NavBtnAddPositive("Open", async (menu: IRaptorMenu) => {
            //If invalid, ignore
            if (!this.currentFilenameValid || !this.GetIsFileListSuccessful()) { return; }

            //Set to loading state
            builder.NavBtnSetState("open", RaptorMenuButtonStatus.Loading);

            //Request file access info
            var info = await this.conn.IoGetFileAccessInfo(this.currentFilename);

            //Make we have access
            if (!info.can_read) {
                this.conn.dialog.ShowNegativeNotice("Can't Use File", "Sorry, you don't have access to read this file.", "Cancel");
                builder.NavBtnSetState("open", RaptorMenuButtonStatus.Enabled);
                return;
            }

            //Finish
            this.callback(this.currentFilename);
            menu.Close();
        }, "open");
        builder.NavBtnSetState("open", RaptorMenuButtonStatus.Disabled);
    }

    protected FileSelected(dirName: string, fileName: string) {
        this.currentFilename = dirName + "/" + fileName;
        if (this.builder == null) { return; }
        if (fileName.length == 0 || !this.GetIsFileListSuccessful()) {
            this.currentFilenameValid = false;
            this.builder.NavBtnSetState("open", RaptorMenuButtonStatus.Disabled);
        } else {
            this.currentFilenameValid = true;
            this.builder.NavBtnSetState("open", RaptorMenuButtonStatus.Enabled);
        }
    }

}