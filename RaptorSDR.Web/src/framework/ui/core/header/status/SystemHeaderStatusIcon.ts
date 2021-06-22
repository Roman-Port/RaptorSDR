import RaptorUiUtil from "../../../../../../sdk/util/RaptorUiUtil";

require("./status.css");

export default class SystemHeaderStatusIcon {

    constructor(container: HTMLElement, minValue: number, maxValue: number, inverse: boolean, classname: string, units: string) {
        //Configure
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.inverse = inverse;
        this.units = units;

        //Create main area
        this.body = RaptorUiUtil.CreateDom("div", "rsys_headerstatus_indicator", container)
            .AddClass(classname);
        this.body.addEventListener("click", (evt: MouseEvent) => {
            evt.preventDefault();
            this.body.classList.toggle("rsys_headerstatus_indicator_alt");
        })

        //Create text area
        this.areaText = RaptorUiUtil.CreateDom("div", "rsys_headerstatus_text", this.body).SetText("NO INFO");

        //Create graphical indicators
        for (var i = 0; i < SystemHeaderStatusIcon.COLORS.length; i++) {
            var e = RaptorUiUtil.CreateDom("div", "rsys_headerstatus_graphic", this.body);
            this.areaGraphical.push(e);
        }

        //Set default
        this.UpdateValue(minValue);
    }

    AddTipText(title: string, body: string): SystemHeaderStatusIcon {
        var e = RaptorUiUtil.CreateDom("div", "rsys_headerstatus_tip", this.body)
            .AddClass("system_popout");
        RaptorUiUtil.CreateDom("div", "rsys_headerstatus_tip_title", e).innerHTML = title;
        RaptorUiUtil.CreateDom("div", null, e).innerHTML = body;
        return this;
    }

    UpdateValue(value: number) {
        //Determine where this lies on the range
        var scaled = (value - this.minValue) / (this.maxValue - this.minValue);
        if (this.inverse)
            scaled = 1 - scaled;
        scaled = Math.min(SystemHeaderStatusIcon.COLORS.length - 1, Math.max(0, Math.floor(scaled * SystemHeaderStatusIcon.COLORS.length)));

        //Update text
        this.areaText.innerText = (Math.round(value * 10) / 10) + " " + this.units;

        //Update graphical display
        for (var i = 0; i < SystemHeaderStatusIcon.COLORS.length; i++) {
            this.areaGraphical[i].style.background = i > scaled ? "#1d2023" : SystemHeaderStatusIcon.COLORS[SystemHeaderStatusIcon.COLORS.length - 1 - scaled];
        }
    }

    private body: HTMLElement;
    private minValue: number;
    private maxValue: number;
    private inverse: boolean;
    private units: string;

    private areaText: HTMLElement;
    private areaGraphical: HTMLElement[] = [];

    private static readonly COLORS: string[] = [
        "#42f548",
        "#b6f542",
        "#f5ef42",
        "#f5b342",
        "#f57542",
        "#f54242"
    ];

}