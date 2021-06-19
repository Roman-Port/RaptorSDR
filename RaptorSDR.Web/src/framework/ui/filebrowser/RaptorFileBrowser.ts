import IRaptorMenu from "../../../../sdk/ui/menu/IRaptorMenu";
import RaptorMenuBuilder from "../../../../sdk/ui/menu/RaptorMenuBuilder";
import RaptorConnection from "../../RaptorConnection";
import DirectoryListing from "../../web/entities/file/DirectoryListing";
import DirectoryListingEntry from "../../web/entities/file/DirectoryListingEntry";
import { DirectoryListingEntryType } from "../../web/entities/file/DirectoryListingEntryType";
import { DirectoryListingStatus } from "../../web/entities/file/DirectoryListingStatus";
import RootListing from "../../web/entities/file/RootListing";
import RaptorDomBuilder from "../RaptorDomBuilder";
import RaptorUiUtil from "../RaptorUiUtil";

require("./filebrowser.css");

export default class RaptorFileBrowser {

    constructor(conn: RaptorConnection, title: string) {
        //Configure
        this.conn = conn;
        this.title = title;

        //Create parts
        this.content = RaptorUiUtil.CreateDom("div", "rsys_filebrowser");
        this.sidebar = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_sidebar", this.content);
        this.main = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_main", this.content);

        //Create path box
        this.pathContainer = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_path", this.main);
        RaptorUiUtil.CreateDom("div", "rsys_filebrowser_path_rolloff", this.pathContainer);
        this.path = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_path_carousel", this.pathContainer);

        //Create error box
        this.errorBox = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_error", this.main);
        this.errorBoxTitle = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_error_title", this.errorBox);
        this.errorBoxBody = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_error_body", this.errorBox);

        //Create input box
        this.inputBox = RaptorUiUtil.CreateDom("input", "rsys_filebrowser_input") as any as HTMLInputElement;
        this.inputBox.addEventListener("input", (evt: Event) => {
            this.FileSelected(this.currentPath, this.inputBox.value);
        });

        //Prepare filegrid
        this.filegrid = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid", this.main);
        this.filegridHeader = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_row", this.filegrid)
            .AddClass("rsys_filebrowser_filegrid_header");
        RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_cell_icon", this.filegridHeader)
            .AddClass("rsys_filebrowser_filegrid_cell")
        RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_cell_name", this.filegridHeader)
            .AddClass("rsys_filebrowser_filegrid_cell")
            .AddClass("rsys_filebrowser_filegrid_cell_sortable")
            .Chain((node: RaptorDomBuilder) => node.addEventListener("click", () => this.ChangeSortMode(1)))
            .innerText = "Name";
        RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_cell_date", this.filegridHeader)
            .AddClass("rsys_filebrowser_filegrid_cell")
            .AddClass("rsys_filebrowser_filegrid_cell_sortable")
            .Chain((node: RaptorDomBuilder) => node.addEventListener("click", () => this.ChangeSortMode(2)))
            .innerText = "Date Modified";
        RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_cell_size", this.filegridHeader)
            .Chain((node: RaptorDomBuilder) => node.addEventListener("click", () => this.ChangeSortMode(3)))
            .AddClass("rsys_filebrowser_filegrid_cell")
            .AddClass("rsys_filebrowser_filegrid_cell_sortable")
            .innerText = "Size";

        //Prepare the sidebar
        this.sidebar.classList.add("loading");
        this.conn.IoGetRoots().then((listing: RootListing) => {
            //Find the drive that the managed area sits on so we can get the space for it
            var managedSize = 0;
            var managedFree = 0;
            for (var i = 0; i < listing.drives.length; i++) {
                if (listing.drives[i].path == listing.managed_root) {
                    managedFree = listing.drives[i].free;
                    managedSize = listing.drives[i].size;
                }
            }

            //Create managed entry and divider
            this.CreateRootItem("rsys_filebrowser_sidebar_entry_home", "RaptorSDR", "managed:/", managedSize, managedFree);
            RaptorUiUtil.CreateDom("div", "rsys_filebrowser_sidebar_sep", this.sidebar);

            //Add drives
            for (var i = 0; i < listing.drives.length; i++) {
                var d = listing.drives[i];
                var name = d.name.replace("\\", "");
                this.CreateRootItem("rsys_filebrowser_sidebar_entry_drive", d.nick.length == 0 ? d.name : d.nick + " (" + name + ")", d.path, d.size, d.free);
            }

            //Remove loader
            this.sidebar.classList.remove("loading");
        });

        //test
        this.RequestDirectory("C:\\");
    }

    protected conn: RaptorConnection;
    private title: string;

    private content: HTMLElement;
    private sidebar: HTMLElement;
    private main: HTMLElement;
    private filegrid: HTMLElement;
    private filegridHeader: HTMLElement;
    private pathContainer: HTMLElement;
    private path: HTMLElement;
    private errorBox: HTMLElement;
    private errorBoxTitle: HTMLElement;
    private errorBoxBody: HTMLElement;
    private inputBox: HTMLInputElement;

    private lastResponse: DirectoryListing;
    private currentPath: string;

    private static sortMode: number = 1;
    private static sortModeInvert: boolean = false;

    private static ICON_MAP: { [key: string]: string } = {
        "wav": "audio",
        "mp3": "audio",
        "flac": "audio",
        "wma": "audio",
        "mp4": "audio",
        "ts": "audio",
        "mov": "audio",

        "txt": "text",
        "doc": "text",
        "docx": "text",

        "pdf": "photo",
        "png": "photo",
        "jpg": "photo",
        "jpeg": "photo",
        "bmp": "photo",
        "tiff": "photo",
        "webp": "photo",
    };
    private static SIZE_NAMES: string[] = [
        "KB",
        "MB",
        "GB",
        "TB",
        "PB"
    ];
    private static SORT_COLUMNS: ((a: DirectoryListingEntry, b: DirectoryListingEntry) => number)[] = [
        null,
        (a: DirectoryListingEntry, b: DirectoryListingEntry) => { return a.name.localeCompare(b.name); },
        (a: DirectoryListingEntry, b: DirectoryListingEntry) => { if (a.date == b.date) { return a.name.localeCompare(b.name); } else { return (a.date > b.date) ? 1 : -1 } },
        (a: DirectoryListingEntry, b: DirectoryListingEntry) => { if (a.size == b.size) { return a.name.localeCompare(b.name); } else { return (a.size > b.size) ? 1 : -1 } },
    ];

    Show() {
        var builder = new RaptorMenuBuilder(800, 550);
        this.BuildDialog(builder);
        this.conn.ShowMenu(builder);
    }

    protected BuildDialog(builder: RaptorMenuBuilder) {
        builder.SetTitleNeutral(this.title);
        builder.NavBtnAddCustom(this.inputBox);
        builder.SetContent(this.content);
    }

    protected FileSelected(dirName: string, fileName: string) {

    }

    protected GetIsFileListSuccessful(): boolean {
        return this.lastResponse.status == DirectoryListingStatus.OK;
    }

    private async RequestDirectory(path: string) {
        //Clear current entries and start loading
        this.currentPath = path.replace("\\", "/");
        while (this.currentPath.includes("//"))
            this.currentPath = this.currentPath.replace("//", "/");
        this.ClearFileGrid();
        this.main.classList.remove("rsys_filebrowser_main_errored");
        this.lastResponse = null;
        this.filegrid.classList.add("loading");
        this.UpdatePath();

        //Clear selected file
        this.inputBox.value = "";
        this.FileSelected(this.currentPath, "");

        //Get directory listing
        this.lastResponse = await this.conn.IoGetDirListing(path);

        //Update
        this.filegrid.classList.remove("loading");
        this.UpdateDirectoryList();
    }

    private UpdatePath() {
        //Clear
        this.path.innerHTML = "";

        //Get the current path and split it
        var parts = this.currentPath.split('/');

        //Add all
        var fullPath = "";
        for (var i = 0; i < parts.length; i++) {
            fullPath += parts[i] + "/";
            RaptorUiUtil.CreateDom("div", "rsys_filebrowser_path_divider", this.path);
            var e = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_path_item", this.path);
            e.innerText = parts[i];
            (e as any)._xraptor_path = fullPath;
            e.addEventListener("click", (evt: MouseEvent) => {
                this.RequestDirectory((evt.currentTarget as any)._xraptor_path);
            });
        }

        //Check if we need to enable extended mode if it's too large
        if (this.path.offsetWidth > (this.pathContainer.offsetWidth - 15 - 15)) {
            this.pathContainer.classList.add("rsys_filebrowser_path_extended");
        } else {
            this.pathContainer.classList.remove("rsys_filebrowser_path_extended");
        }
    }

    private ShowError(iconClass: string, title: string, body: string) {
        //Reset icon
        this.errorBox.className = "rsys_filebrowser_error";
        this.errorBox.classList.add(iconClass);

        //Set texts
        this.errorBoxTitle.innerText = title;
        this.errorBoxBody.innerText = body;

        //Change state
        this.main.classList.add("rsys_filebrowser_main_errored");
    }

    private CreateRootItem(iconClass: string, text: string, path: string, size: number, free: number) {
        var e = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_sidebar_entry", this.sidebar);
        RaptorUiUtil.CreateDom("div", null, e).innerText = text;
        RaptorUiUtil.CreateDom("div", "rsys_filebrowser_sidebar_space_consumed", RaptorUiUtil.CreateDom("div", "rsys_filebrowser_sidebar_space", e)).style.width = (((size - free) / size) * 100).toString() + "%";
        e.classList.add(iconClass);
        (e as any)._xraptor_path = path;
        e.addEventListener("click", (evt: MouseEvent) => {
            this.RequestDirectory((evt.currentTarget as any)._xraptor_path);
        });
    }

    private ChangeSortMode(requestedIndex: number) {
        if (RaptorFileBrowser.sortMode == requestedIndex) {
            RaptorFileBrowser.sortModeInvert = !RaptorFileBrowser.sortModeInvert;
        } else {
            RaptorFileBrowser.sortMode = requestedIndex;
            RaptorFileBrowser.sortModeInvert = false;
        }
        this.UpdateDirectoryList();
    }

    private ClearFileGrid() {
        while (this.filegrid.children.length > 1) {
            this.filegrid.lastChild.remove();
        }
    }

    private UpdateDirectoryList() {
        //If the response is null, we're loading. Just cancel
        if (this.lastResponse == null) { return; }

        //Check if there were any errors
        switch (this.lastResponse.status) {
            case DirectoryListingStatus.OK: break;
            case DirectoryListingStatus.DoesNotExist:
                this.ShowError("rsys_filebrowser_error_lost", "Directory No Longer Exists", "This folder was removed.");
                return;
            case DirectoryListingStatus.OperatingSystemDenied:
                this.ShowError("rsys_filebrowser_error_denied", "RaptorSDR Can't Access Directory", "The operating system denied access to this folder. Try restarting RaptorSDR with elevated privileges.");
                return;
            case DirectoryListingStatus.UserDeniedManaged:
                this.ShowError("rsys_filebrowser_error_locked", "Can't Access Directory", "You don't have permissions to access any folders. Ask the server admin to give you access.");
                return;
            case DirectoryListingStatus.UserDeniedUnmanaged:
                this.ShowError("rsys_filebrowser_error_locked", "Can't Access Directory", "You don't have permissions to freely access folders, but you can still access the managed folder! Ask the server admin to give you access.");
                return;
            default:
                this.ShowError("rsys_filebrowser_error_lost", "Unknown Error", "There was an unknown error accessing the folder. Sorry about that.\n\n(" + this.lastResponse.status + ")");
                return;
        }

        //Get listing
        var list = this.lastResponse.list;

        //Sort the listing
        if (RaptorFileBrowser.sortModeInvert) {
            list.sort((a: DirectoryListingEntry, b: DirectoryListingEntry): number => {
                return RaptorFileBrowser.SORT_COLUMNS[RaptorFileBrowser.sortMode](b, a);
            });
        } else {
            list.sort(RaptorFileBrowser.SORT_COLUMNS[RaptorFileBrowser.sortMode]);
        }

        //Reset sort indicators
        for (var i = 0; i < this.filegridHeader.children.length; i++) {
            this.filegridHeader.children[i].classList.remove("rsys_filebrowser_filegrid_cell_sort_up");
            this.filegridHeader.children[i].classList.remove("rsys_filebrowser_filegrid_cell_sort_down");
        }

        //Set current sort
        if (RaptorFileBrowser.sortModeInvert) {
            this.filegridHeader.children[RaptorFileBrowser.sortMode].classList.add("rsys_filebrowser_filegrid_cell_sort_down");
        } else {
            this.filegridHeader.children[RaptorFileBrowser.sortMode].classList.add("rsys_filebrowser_filegrid_cell_sort_up");
        }

        //Clear current files
        this.ClearFileGrid();

        //Add all files
        for (var i = 0; i < list.length; i++) {
            //Get entry
            var d = list[i];

            //Format date
            var dateData = new Date(d.date);
            var date = dateData.toLocaleDateString() + " " + dateData.toLocaleTimeString();

            //Determine the kind of item this is and set it up
            var icon: string;
            var size: string;
            var callback: (data: DirectoryListingEntry) => any;
            switch (d.type) {
                case DirectoryListingEntryType.File:
                    //Determine the kind of icon to display
                    var icon = "generic";
                    var extIndex = d.name.indexOf(".");
                    if (extIndex != -1) {
                        var ext = d.name.substr(extIndex + 1);
                        if (RaptorFileBrowser.ICON_MAP[ext] != null) {
                            icon = RaptorFileBrowser.ICON_MAP[ext];
                        }
                    }

                    //Format filesize
                    var sizeValue = Math.floor(d.size / 1000);
                    var sizeName = 0;
                    while (sizeValue >= 1000) {
                        sizeValue = Math.floor(sizeValue / 1000);
                        sizeName++;
                    }
                    size = sizeValue.toString() + " " + RaptorFileBrowser.SIZE_NAMES[sizeName];

                    //Set callback
                    callback = (data: DirectoryListingEntry) => {
                        this.FileSelected(this.currentPath, data.name);
                        this.inputBox.value = data.name;
                    };

                    break;
                case DirectoryListingEntryType.Directory:
                    //Set defaults
                    icon = "folder";
                    size = "";

                    //Set callback
                    callback = (data: DirectoryListingEntry) => {
                        this.RequestDirectory(data.fullName);
                    };

                    break;
                default:
                    throw new Error("Unknown file type!");
            }

            //Create row
            var row = RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_row", this.filegrid);
            (row as any)._xraptor_data = d;
            (row as any)._xraptor_callback = callback;
            row.addEventListener("click", (evt: MouseEvent) => {
                var c = evt.currentTarget as any;
                c._xraptor_callback(c._xraptor_data);
            });
            RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_cell_icon", row)
                .AddClass("rsys_filebrowser_filegrid_cell")
                .AddClass("rsys_filebrowser_filegrid_cell_icon_" + icon);
            RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_cell_name", row)
                .AddClass("rsys_filebrowser_filegrid_cell")
                .innerText = d.name;
            RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_cell_date", row)
                .AddClass("rsys_filebrowser_filegrid_cell")
                .innerText = date;
            RaptorUiUtil.CreateDom("div", "rsys_filebrowser_filegrid_cell_size", row)
                .AddClass("rsys_filebrowser_filegrid_cell")
                .innerText = size;
        }
    }

}