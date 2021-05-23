export default class RaptorEventDispaptcher<T> {

    constructor() {
        this.subscriptions = [];
    }

    private subscriptions: ((payload: T) => any)[];

    Bind(callback: (payload: T) => any) {
        this.subscriptions.push(callback);
    }

    Fire(payload: T) {
        for (var i = 0; i < this.subscriptions.length; i++) {
            var result = this.subscriptions[i](payload);
            if (result != null && result === true) {
                this.subscriptions.splice(i);
                i--;
			}
        }
    }

}