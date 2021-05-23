export default class RaptorHttpRequestBuilder {

    constructor(url: string, method: string) {
        this.xmlhttp = new XMLHttpRequest();
        this.promise = new Promise<any>((resolve, reject) => {
            this.xmlhttp.onreadystatechange = () => {
                if (this.xmlhttp.readyState == 4 && this.xmlhttp.status == 200) {
                    resolve(this.xmlhttp.response);
                } else if (this.xmlhttp.readyState == 4) {
                    reject(this.xmlhttp.status);
                }
            }
        });
        this.xmlhttp.open(method, url, true);
        this.sent = false;
    }

    private xmlhttp: XMLHttpRequest;
    private promise: Promise<any>;
    private sent: boolean;
    private body: any;

    private Send() {
        //Make sure it hasn't already been sent
        if (this.sent) {
            throw new Error("HTTP request has already been sent!");
        }

        //Send
        this.xmlhttp.send(this.body);
        this.sent = true;
    }

    SetBody(body: any) {
        this.body = body;
        return this;
    }

    async AsJSON<T>() {
        this.xmlhttp.responseType = "json";
        this.Send();
        return (await this.promise) as T;
    }

    async AsArrayBuffer() {
        this.xmlhttp.responseType = "arraybuffer";
        this.Send();
        return (await this.promise) as ArrayBuffer;
    }

}