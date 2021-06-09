import RaptorConnection from "../../RaptorConnection";
import RaptorUiUtil from "../RaptorUiUtil";

require("./login.css");

export default class RaptorLoginPage {

    constructor(mount: HTMLElement, conn: RaptorConnection) {
        //Confiugre
        this.conn = conn;

        //Create basics
        this.cover = RaptorUiUtil.CreateDom("div", "rsys_login", mount);
        this.body = RaptorUiUtil.CreateDom("div", "rsys_login_box", this.cover);
        RaptorUiUtil.CreateDom("div", "rsys_login_title", this.body)
            .SetText("RaptorSDR");
        RaptorUiUtil.CreateDom("div", "rsys_login_sub", this.body)
            .SetText("Log in to get started");
        this.usernameBox = RaptorUiUtil.CreateDom("input", "rsys_login_input", this.body) as any as HTMLInputElement;
        this.usernameBox.type = "text";
        this.usernameBox.placeholder = "Username";
        this.passwordBox = RaptorUiUtil.CreateDom("input", "rsys_login_input", this.body) as any as HTMLInputElement;
        this.passwordBox.type = "password";
        this.passwordBox.placeholder = "Password";
        this.loginBtn = RaptorUiUtil.CreateDom("div", "rsys_login_btn", this.body).SetText("Login");
        this.loginError = RaptorUiUtil.CreateDom("div", "rsys_login_error", this.body);

        //Make login callback
        var loginCallback = async () => {
            //Create request body
            var body = {
                "auth_type": "PASSWORD",
                "username": this.usernameBox.value,
                "password": this.passwordBox.value
            };

            //Set to loading and reset
            this.loginError.innerHTML = "";
            this.loginBtn.classList.add("loading_btn");

            //Send
            var response = await this.conn.GetHttpRequest("/accounts/login", "POST")
                .SetBody(JSON.stringify(body))
                .AsJSON<any>();

            //Unset to loading
            this.loginBtn.classList.remove("loading_btn");

            //Check for errors
            var error = "";
            switch (response["status"]) {
                case "OK":
                    this.callback(response["session_token"]);
                    this.body.classList.remove("rsys_login_box_enabled");
                    localStorage.setItem("RAPTOR_REFRESH_TOKEN", response["refresh_token"]);
                    return;
                case "NO_PERMISSIONS": error = "Account exists, but currently has no permissions"; break;
                case "INVALID_CREDENTIALS": error = "Invalid username or password"; break;
                default: error = "Unknown error"; break;
            }

            //Set
            this.loginError.innerText = error;
        };

        //Bind
        this.loginBtn.addEventListener("click", loginCallback);
        this.usernameBox.addEventListener("keyup", (event) => {
            if (event.keyCode === 13) {
                event.preventDefault();
                loginCallback();
            }
        });
        this.passwordBox.addEventListener("keyup", (event) => {
            if (event.keyCode === 13) {
                event.preventDefault();
                loginCallback();
            }
        });
    }

    private conn: RaptorConnection;
    private callback: (token: string) => void;

    private cover: HTMLElement;
    private body: HTMLElement;
    private usernameBox: HTMLInputElement;
    private passwordBox: HTMLInputElement;
    private loginBtn: HTMLElement;
    private loginError: HTMLElement;

    SetLoading(loading: boolean) {
        if (loading) {
            this.cover.classList.add("loading");
        } else {
            this.cover.classList.remove("loading");
        }
    }

    async PromptLogin(): Promise<string> {
        this.body.classList.add("rsys_login_box_enabled");
        return new Promise((resolve) => {
            this.callback = resolve;
        });
    }

    Remove() {
        this.cover.classList.add("rsys_login_hide");
        window.setTimeout(() => {
            this.cover.remove();
        }, 200);
    }

}