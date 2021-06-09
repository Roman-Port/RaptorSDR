import RaptorDispatcherOpcode from 'RaptorSdk/web/dispatchers/RaptorDispatcherOpcode';
import IRaptorDataProvider from 'RaptorSdk/web/IRaptorDataProvider';
import RaptorConnection from '../RaptorConnection';
import RaptorInfoProvider from './entities/info/RaptorInfoProvider';

export default class RaptorDataProvider implements IRaptorDataProvider {

    constructor(conn: RaptorConnection, info: RaptorInfoProvider) {
        this.info = info;
        this.endpoint = new RaptorDispatcherOpcode(conn.rpcDispatcherDataProvider.CreateSubscription(info.id));
    }

    protected info: RaptorInfoProvider;
    protected endpoint: RaptorDispatcherOpcode;

    GetName(): string {
        return this.info.name;
    }

    GetId(): string {
        return this.info.id;
    }

    GetType(): string {
        return this.info.type;
    }

    As<T>(): T {
        return this as unknown as T;
    }

}