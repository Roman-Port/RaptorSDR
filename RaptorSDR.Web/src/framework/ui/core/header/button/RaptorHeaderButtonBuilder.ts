import RaptorUiUtil from "../../../../../../sdk/util/RaptorUiUtil";
import IRaptorPrimitiveDataProvider from "../../../../../../sdk/web/providers/IRaptorPrimitiveDataProvider";
import RaptorHeaderButtonSheet from "./RaptorHeaderButtonSheet";

export default class RaptorHeaderButtonBuilder {

    constructor(classname: string) {
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_header_button", null);
        this.clicker = RaptorUiUtil.CreateDom("div", "rsys_header_button_clicker", this.mount);
        this.mount.classList.add(classname);
    }

    mount: HTMLElement;
    clicker: HTMLElement;

    private selectedClass: string;
    private unselectedClass: string;

    MakeAccent(): RaptorHeaderButtonBuilder {
        this.mount.classList.add("rsys_header_button_accent");
        return this;
    }

    MakeWhite(): RaptorHeaderButtonBuilder {
        this.mount.classList.add("rsys_header_button_white");
        return this;
    }

    MakeSelectable(selectedClass: string, unselectedClass: string, defaultSelection: boolean): RaptorHeaderButtonBuilder {
        this.selectedClass = selectedClass;
        this.unselectedClass = unselectedClass
        return this.SetSelected(defaultSelection);
    }

    AddOnClick(callback: (btn: RaptorHeaderButtonBuilder) => void): RaptorHeaderButtonBuilder {
        this.clicker.addEventListener("click", () => callback(this));
        return this;
    }

    BindToDataProvider<T>(provider: IRaptorPrimitiveDataProvider<T>, updatedCallback: (value: T, btn: RaptorHeaderButtonBuilder) => void): RaptorHeaderButtonBuilder {
        provider.OnChanged.Bind((value: T) => {
            updatedCallback(value, this);
        });
        return this;
    }

    SetLoading(loading: boolean): RaptorHeaderButtonBuilder {
        if (loading) {
            this.clicker.classList.add("loading_btn");
        } else {
            this.clicker.classList.remove("loading_btn");
        }
        return this;
    }

    SetSelected(selected: boolean): RaptorHeaderButtonBuilder {
        if (selected) {
            this.mount.classList.add(this.selectedClass);
            this.mount.classList.remove(this.unselectedClass);
        } else {
            this.mount.classList.remove(this.selectedClass);
            this.mount.classList.add(this.unselectedClass);
        }
        return this;
    }

    Build(container: RaptorHeaderButtonSheet) {
        container.AddButton(this.mount);
    }

}