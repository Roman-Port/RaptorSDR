import AuthError from "../errors/AuthError";
import RaptorConnection from "../RaptorConnection";

export default class RaptorAuth {

    static async Register(conn: RaptorConnection, username: string, password: string): Promise<string> {
        //Build request
        var request = {
            "username": username,
            "password": password
        };

        //Send
        var response = await conn.GetHttpRequest("/accounts/register", "POST")
            .SetBody(JSON.stringify(request))
            .AsJSON<any>();

        //If failed, abort
        if (response["ok"] !== true) {
            throw new AuthError(response["status"]);
        }

        return response["token"];
    }

    static async Login(conn: RaptorConnection, username: string, password: string): Promise<string> {
        //Build request
        var request = {
            "username": username,
            "password": password
        };

        //Send
        var response = await conn.GetHttpRequest("/accounts/login", "POST")
            .SetBody(JSON.stringify(request))
            .AsJSON<any>();

        //If failed, abort
        if (response["ok"] !== true) {
            throw new AuthError(response["status"]);
        }

        return response["token"];
    }

}