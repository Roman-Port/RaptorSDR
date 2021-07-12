import RaptorUiUtil from "../../../../sdk/util/RaptorUiUtil";
import AuthError from "../../errors/AuthError";
import RaptorConnection from "../../RaptorConnection";
import IRaptorUserInfo from "../../web/IRaptorUserInfo";

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
            //Set to loading and reset
            this.loginError.innerHTML = "";
            this.loginBtn.classList.add("loading_btn");

            //Send request
            try {
                this.callback(await this.conn.AuthLogin(this.usernameBox.value, this.passwordBox.value));
            } catch (err: any) {
                //Assume this is an auth error and get the message
                var error = "";
                switch ((err as AuthError).code) {
                    case "NO_PERMISSIONS": error = "Account exists, but currently has no permissions"; break;
                    case "INVALID_CREDENTIALS": error = "Invalid username or password"; break;
                    default: error = "Unknown error"; break;
                }

                //Set
                this.loginError.innerText = error;
            } finally {
                //Unset loading
                this.loginBtn.classList.remove("loading_btn");
            }
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
    private callback: (info: IRaptorUserInfo) => void;

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

    async PromptLogin(): Promise<IRaptorUserInfo> {
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