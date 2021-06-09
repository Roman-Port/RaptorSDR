import RaptorEventDispaptcher from "../RaptorEventDispatcher";

export default interface IRaptorEndpoint {

    SendMessage(message: any): void;

    OnMessage: RaptorEventDispaptcher<any>;

}