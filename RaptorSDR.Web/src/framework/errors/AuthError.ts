export default class AuthError extends Error {

    constructor(code: string) {
        super("Server replied with error " + code);
        this.code = code;
    }

    code: string;

}