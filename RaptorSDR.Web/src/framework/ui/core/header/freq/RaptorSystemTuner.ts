import IRaptorConnection from "RaptorSdk/IRaptorConnection";
import IRaptorPrimitiveDataProvider from "RaptorSdk/web/providers/IRaptorPrimitiveDataProvider";
import RaptorUiUtil from "../../../../../../sdk/util/RaptorUiUtil";

require("./tuner.css");

export default class RaptorSystemTuner {

    constructor(mount: HTMLElement, conn: IRaptorConnection) {
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
                (e as any)._raptor_index = (3 * 4) - ((g * 3) + n) - 1;
                this.CreatePaddle(e, "rsys_header_tuner_num_paddle_top", 1);
                this.CreatePaddle(e, "rsys_header_tuner_num_paddle_bottom", -1);
                e.addEventListener("wheel", (evt: WheelEvent) => {
                    var ctx = evt.currentTarget as HTMLElement;
                    this.UpdateValue((ctx as any)._raptor_index, -Math.max(-1, Math.min(1, evt.deltaY)));
                    evt.preventDefault();
                    evt.stopPropagation();
                });
                this.digits.push(RaptorUiUtil.CreateDom("div", "rsys_header_tuner_num_value", e));
            }
        }

        //Get data provider and bind
        this.freqProvider = conn.GetPrimitiveDataProvider<number>("RaptorSDR.Radio.CenterFreq");
        this.freqProvider.OnChanged.Bind((value: number) => this.Refresh(value));
        this.Refresh(this.freqProvider.GetValue());
    }

    private mount: HTMLElement;
    private digits: HTMLElement[];
    private freqProvider: IRaptorPrimitiveDataProvider<number>;

    private CreatePaddle(digit: HTMLElement, classname: string, direction: number) {
        var e = RaptorUiUtil.CreateDom("div", "rsys_header_tuner_num_paddle", digit);
        e.classList.add(classname);
        (e as any)._raptor_direction = direction;
        e.addEventListener("mousedown", (evt: MouseEvent) => {
            var ctx = evt.currentTarget as HTMLElement;
            this.UpdateValue((ctx.parentNode as any)._raptor_index, (ctx as any)._raptor_direction);
            evt.preventDefault();
            evt.stopPropagation();
        });
    }

    private UpdateValue(digitIndex: number, direction: number) {
        var value = Math.pow(10, digitIndex) * direction;
        this.freqProvider.SetValue(this.freqProvider.GetValue() + value);
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