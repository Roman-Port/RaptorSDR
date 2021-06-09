import RaptorDomBuilder from "./RaptorDomBuilder";

export default class RaptorUiUtil {

    static CreateDom(type: string, classname?: string, parent?: HTMLElement): RaptorDomBuilder {
        //Create
        var e = document.createElement(type) as any;

        //Set custom prototypes. Ugly but it works
        e.SetStyleAttribute = function (key: string, value: string) {
            this.style[key] = value;
            return this;
        };
        e.Chain = function (callback: (node: RaptorDomBuilder) => void) {
            callback(this);
            return this;
        };
        e.SetText = function (text: string) {
            this.innerText = text;
            return this;
        };
        e.AddClass = function (name: string) {
            this.classList.add(name);
            return this;
        }

        //Apply
        if (classname != null) {
            e.classList.add(classname);
        }
        if (parent != null) {
            parent.appendChild(e);
        }

        //Cast
        return e as RaptorDomBuilder;
    }

}