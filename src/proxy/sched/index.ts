import { Proxy, IProxy, IFacade, IObserver, Observer, INotification } from "pure-framework";

import AppEvents from "../../config/events";
// import { SchedInterval } from "../../config/config";
import { TickBody } from "../../config/types";

const SchedInterval = 100;

class SchedProxy extends Proxy implements IProxy {
    static TagNAME = "SCHED_PROXY";

    private observer: IObserver;
    private schedHandler?: NodeJS.Timeout;
    constructor(facade: IFacade) {
        super(SchedProxy.TagNAME, facade);

        this.observer = new Observer(this._onNotification, this);
    }

    onRegister() {
        super.onRegister();

        this.facade.registerObserver(AppEvents.EvtAppReady, this.observer);
    }

    onRemove() {
        this.facade.removeObserver(AppEvents.EvtAppReady, this);
    }


    private _onNotification(notification: INotification) {
        const name = notification.getName();
        const body = notification.getBody();
        void body;
        if (name === AppEvents.EvtAppReady) {
            this._onAppReady();
        }
    }

    private _onAppReady() {
        this._startSched();
    }

    private _startSched() {
        this._stopSched();

        const self = this;
        let uptime = Math.floor(process.uptime() * 1000);
        this.schedHandler = setTimeout(function _tick() {
            self.schedHandler = undefined;

            const now = Math.floor(process.uptime() * 1000);
            const elapsed = now - uptime;
            uptime = now;
            self.sendNotification(AppEvents.EvtSchedTick, { elapsed } as TickBody);

            self.schedHandler = setTimeout(_tick, SchedInterval);
        }, SchedInterval);
    }

    private _stopSched() {
        if (this.schedHandler !== undefined) {
            clearTimeout(this.schedHandler);
            this.schedHandler = undefined;
        }
    }
}

export default SchedProxy;