import RaptorUiUtil from "../../../RaptorUiUtil";

require("./tuner.css");

export default class RaptorSystemTuner {

    constructor(mount: HTMLElement) {
        //Create container
        this.mount = RaptorUiUtil.CreateDom("div", "rsys_header_tuner", mount);

        //Create digit groups
        this.digits = [];
        for (var g = 0; g < 4; g++) {
            if (g != 0) {
                RaptorUiUtil.CreateDom("div", "rsys_header_tuner_dot", this.mount).innerText = ".";
            }
            for (var n = 0; n < 3; n++) {
                var e = RaptorUiUtil.CreateDom("div", "rsys_header_tuner_num", this.mount);
                (e as any)._raptor_index = (g * 3) + n;
                this.CreatePaddle(e, "rsys_header_tuner_num_paddle_top", 1);
                this.CreatePaddle(e, "rsys_header_tuner_num_paddle_bottom", -1);
                this.digits.push(RaptorUiUtil.CreateDom("div", null, e));
            }
        }

        this.Refresh(93700000);
    }

    private mount: HTMLElement;
    private digits: HTMLElement[];

    private CreatePaddle(digit: HTMLElement, classname: string, direction: number) {
        var e = RaptorUiUtil.CreateDom("div", "rsys_header_tuner_num_paddle", digit);
        e.classList.add(classname);
        (e as any)._raptor_direction = direction;
    }

    private Refresh(freq: number) {
        var digit;
        var value;
        for (var i = 0; i < this.digits.length; i++) {
            digit = this.digits[this.digits.length - 1 - i];
            value = Math.floor(freq / Math.pow(10, i));
            digit.innerText = (value % 10).toString();
            digit.style.opacity = (value == 0) ? "0.5" : "1";
        }
    }

}