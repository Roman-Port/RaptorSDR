import RaptorEventDispaptcher from "../../RaptorEventDispatcher";
import IRaptorEndpoint from "../IRaptorEndpoint";

export default class RaptorDispatcherOpcode {

    constructor(parent: IRaptorEndpoint) {
        this.parent = parent;
        this.subscriptions = [];
    }

    private parent: IRaptorEndpoint;
    private subscriptions: RaptorDispatcherOpcode_Subscription[];

    CreateSubscription(opcode: string) {
        var sub = new RaptorDispatcherOpcode_Subscription(this.parent, opcode);
        this.subscriptions.push(sub);
        return sub;
    }

}

class RaptorDispatcherOpcode_Subscription implements IRaptorEndpoint {

    constructor(parent: IRaptorEndpoint, opcode: string) {
        this.parent = parent;
        this.opcode = opcode;
        this.OnMessage = new RaptorEventDispaptcher<any>();
        parent.OnMessage.Bind((message: any) => {
            if (message["op"] == this.opcode) {
                this.OnMessage.Fire(message["d"]);
            }
        });
    }

    SendMessage(message: any): void {
        this.parent.SendMessage({
            "op": this.opcode,
            "d": message
        });
    }

    OnMessage: RaptorEventDispaptcher<any>;

    private parent: IRaptorEndpoint;
    private opcode: string;

}