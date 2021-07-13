import IRaptorConnection from "RaptorSdk/IRaptorConnection";
import IRaptorWindow from "../sdk/ui/core/IRaptorWindow";
import IRaptorWindowContext from "../sdk/ui/core/IRaptorWindowContext";
import RaptorSize from "../sdk/ui/RaptorSize";
import RaptorUiUtil from "../sdk/util/RaptorUiUtil";
import IRaptorPrimitiveDataProvider from "../sdk/web/providers/IRaptorPrimitiveDataProvider";
import PiCodeDb from "./PiCodeDb";
import PiCodeEntry from "./PiCodeEntry";

require("./style.css");

export default class RdsWindow implements IRaptorWindow {

    constructor(ctx: IRaptorWindowContext) {
        this.conn = ctx.conn;
        this.info = ctx.info;
        this.db = new PiCodeDb();
    }

    private conn: IRaptorConnection;
    private info: any;
    private db: PiCodeDb;
    private isStationInfoOpen: boolean;

    private pTop: HTMLElement;
    private pStation: HTMLElement;
    private pStationContent: HTMLElement;

    private entry: PiCodeEntry;

    private ePs: HTMLElement;
    private eRt: HTMLElement;
    private ePi: HTMLElement;
    private eStereo: HTMLElement;
    private eRds: HTMLElement;

    private eState: HTMLElement;
    private eCity: HTMLElement;
    private eDistance: HTMLElement;
    private eDirection: HTMLElement;

    GetWindowName(): string {
        return "RDS";
    }

    GetIsHeaderless(): boolean {
        return true;
    }

    GetMinSize(): RaptorSize {
        return new RaptorSize(700, 40);
    }

    GetMaxSize(): RaptorSize {
        return new RaptorSize(100000, 40);
    }

    ResizeWindow(width: number, height: number): void {
        
    }

    CreateWindow(window: HTMLElement): void {
        //Create top container
        this.pTop = document.createElement("div");
        this.pTop.classList.add("rplug_rds");
        window.appendChild(this.pTop);

        //Create top elements
        this.ePs = this.CreateBasicElementDP(this.pTop, this.conn.VFO.RDS.PsBuffer, (value: string) => value, "rplug_rds_ps");
        this.eRt = this.CreateBasicElementDP(this.pTop, this.conn.VFO.RDS.RtBuffer, (value: string) => value.trimEnd(), "rplug_rds_rt");
        this.ePi = this.CreateBasicElement(this.pTop, "rplug_rds_pi");
        this.eRds = this.CreateIndicatorElement(this.pTop, this.conn.VFO.RdsDetected, "RDS");
        this.eStereo = this.CreateIndicatorElement(this.pTop, this.conn.VFO.StereoDetected, "STEREO");

        //Create the station info container
        this.pStation = document.createElement("div");
        this.pStation.classList.add("rplug_rds_stationinfo");
        this.ePi.parentElement.appendChild(this.pStation);
        this.pStationContent = document.createElement("div");
        this.pStationContent.classList.add("rplug_rds_stationinfo_content");
        this.pStation.appendChild(this.pStationContent);

        //Create station info bits
        this.eState = this.CreateBasicElement(this.pStationContent);
        this.CreateDividingElement(this.pStationContent);
        this.eCity = this.CreateBasicElement(this.pStationContent);

        //Create station info bits that require GPS
        this.CreateDividingElement(this.pStationContent).classList.add("rplug_rds_stationinfo_gps");
        this.eDistance = this.CreateBasicElement(this.pStationContent, "rplug_rds_stationinfo_distance");
        this.eDistance.classList.add("rplug_rds_stationinfo_gps");
        this.eDirection = document.createElement("div");
        this.eDirection.classList.add("rplug_rds_stationinfo_gps");
        this.eDirection.classList.add("rplug_rds_stationinfo_direction");
        this.pStationContent.appendChild(this.eDirection);

        //Bind to PI code
        this.conn.VFO.RDS.PiCode.OnChanged.Bind(async (pi: number) => {
            //Hide
            this.pTop.classList.remove("rplug_rds_stationinfo_info");

            //Look up PI code in database
            this.entry = await this.db.GetStationInfo(pi);

            //Update
            if (this.entry != null) {
                //Set up callsign
                var call = this.entry.GetCallsign();
                if (!call.includes("-")) { call += "-FM"; } //for consistency
                this.ePi.innerText = call;

                //Show
                this.pTop.classList.add("rplug_rds_stationinfo_info");

                //Update dialog
                if (this.isStationInfoOpen) {
                    this.UpdateStationInfo();
                }
            }
        });

        //Bind events
        this.ePi.addEventListener("mouseover", () => {
            this.isStationInfoOpen = true;
            this.UpdateStationInfo();
        });
        this.ePi.addEventListener("mouseout", () => {
            this.isStationInfoOpen = false;
        });
    }

    DestoryWindow(): void {
        
    }

    private UpdateStationInfo() {
        //Set station info
        this.pStation.classList.remove("rplug_rds_stationinfo_activegps");
        this.eState.innerText = this.entry.GetStateShort();
        this.eCity.innerText = this.entry.GetCity();

        //Move
        this.MoveStationInfo(); 

        //Get GPS location
        navigator.geolocation.getCurrentPosition((location: GeolocationPosition) => {
            //Calculate distance and direction
            var distance = RdsWindow.CalculateDistance(location.coords.latitude, location.coords.longitude, this.entry.GetLat(), this.entry.GetLon());
            var direction = Math.atan2(this.entry.GetLat() - location.coords.latitude, this.entry.GetLon() - location.coords.longitude) * 180 / Math.PI

            //Update
            this.eDistance.innerText = (Math.round(distance * 100) / 100) + "mi";
            this.eDirection.style.transform = "rotate(" + direction + "deg)";

            //Show
            this.pStation.classList.add("rplug_rds_stationinfo_activegps");

            //Move
            this.MoveStationInfo(); 
        });
    }

    private static CalculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        var R = 3958.8; //Radius of the earth in miles
        var dLat = RdsWindow.Deg2rad(lat2 - lat1);
        var dLon = RdsWindow.Deg2rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(RdsWindow.Deg2rad(lat1)) * Math.cos(RdsWindow.Deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static Deg2rad(deg: number): number {
        return deg * (Math.PI / 180)
    }

    private MoveStationInfo() {
        var container = this.ePi.parentElement;
        var dialog = this.pStation;
        var content = this.pStationContent;

        var width = content.clientWidth;
        var widthHalf = width / 2;
        var containerRect = container.getBoundingClientRect()
        var mount = containerRect.left + (containerRect.width / 2);
        var mountLeft = mount - widthHalf;
        var mountRight = mount + widthHalf;

        if (mountRight > window.innerWidth) {
            var delta = mountRight - window.innerWidth;
            mountLeft -= delta;
            mountRight -= delta;
            console.log(delta);
        }

        dialog.style.left = mountLeft + "px";
        dialog.style.width = (mountRight - mountLeft) + "px";
    }

    private CreateDividingElement(parent: HTMLElement): HTMLElement {
        var e = document.createElement("div");
        e.classList.add("rplug_rds_stationinfo_div");
        e.innerText = "-";
        parent.appendChild(e);
        return e;
    }

    private CreateBasicElement(parent: HTMLElement, extraClass?: string): HTMLElement {
        var e = document.createElement("div");
        e.classList.add("rplug_rds_element");
        parent.appendChild(e);

        var c = document.createElement("div");
        c.classList.add("rplug_rds_text");
        e.appendChild(c);

        if (extraClass != null) { e.classList.add(extraClass); }

        return c;
    }

    private CreateBasicElementDP(parent: HTMLElement, dataProvider: IRaptorPrimitiveDataProvider<any>, preprocess: (value: string) => string, extraClass?: string): HTMLElement {
        var c = this.CreateBasicElement(parent, extraClass);

        dataProvider.OnChanged.Bind((value: any) => {
            RdsWindow.UpdateText(c, preprocess(value));
        });

        return c;
    }

    private CreateIndicatorElement(parent: HTMLElement, dataProvider: IRaptorPrimitiveDataProvider<boolean>, text: string): HTMLElement {
        var e = document.createElement("div");
        e.classList.add("rplug_rds_element");
        e.classList.add("rplug_rds_indicator");
        parent.appendChild(e);

        var c = document.createElement("div");
        c.classList.add("rplug_rds_text");
        c.innerText = text;
        e.appendChild(c);
        
        dataProvider.OnChanged.Bind((value: boolean) => {
            RdsWindow.UpdateIndicator(e, value);
        });
        RdsWindow.UpdateIndicator(e, dataProvider.GetValue());
        return e;
    }

    private static UpdateIndicator(indicator: HTMLElement, value: boolean) {
        if (value) {
            indicator.classList.remove("rplug_rds_indicator_unlit");
        } else {
            indicator.classList.add("rplug_rds_indicator_unlit");
        }
    }

    private static UpdateText(text: HTMLElement, value: any) {
        if (value == null) { return; }
        text.innerText = (value as string).toString().replace("\r", "").replace("\n", "");
    }

    static CreateDummy(): HTMLElement {
        var body = RaptorUiUtil.CreateDom("div", "rplug_rds").AddClass("rplug_rds_dummy");
        RaptorUiUtil.CreateDom("div", "rplug_rds_text", RaptorUiUtil.CreateDom("div", "rplug_rds_element", body).AddClass("rplug_rds_ps")).innerText = "KQRS    ";
        RaptorUiUtil.CreateDom("div", "rplug_rds_text", RaptorUiUtil.CreateDom("div", "rplug_rds_element", body).AddClass("rplug_rds_rt")).innerText = "Minnesota's Classic Rock Station 92.5 FM";
        RaptorUiUtil.CreateDom("div", "rplug_rds_text", RaptorUiUtil.CreateDom("div", "rplug_rds_element", body).AddClass("rplug_rds_indicator")).innerText = "RDS";
        RaptorUiUtil.CreateDom("div", "rplug_rds_text", RaptorUiUtil.CreateDom("div", "rplug_rds_element", body).AddClass("rplug_rds_indicator")).innerText = "STEREO";
        return body;
    }

}