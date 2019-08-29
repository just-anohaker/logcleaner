import { Mediator, IMediator } from "pure-framework";
import { IFacade, INotification, IObserver, Observer } from "pure-framework";
import shelljs from "shelljs";

import AppEvents from "../../config/events";
import { TickBody } from "../../config/types";

class PM2FlushMediator extends Mediator implements IMediator {
    static TagNAME = "PM2FLUSH_MEDIATOR";

    private static FLSUH_INTERVAL = 12 * 60 * 60 * 1000;

    private observer: IObserver;
    private elapsed: number;
    private doing: boolean;
    constructor(facade: IFacade) {
        super(PM2FlushMediator.TagNAME, facade);

        this.observer = new Observer(this._onNotification, this);
        this.elapsed = 0;
        this.doing = false;
    }

    onRegister() {
        super.onRegister();

        this.facade.registerObserver(AppEvents.EvtSchedTick, this.observer);
    }

    onRemove() {
        super.onRemove();

        this.facade.removeObserver(AppEvents.EvtSchedTick, this);
    }

    private _onNotification(notification: INotification) {
        const name = notification.getName();
        const body = notification.getBody();
        void body;

        if (name === AppEvents.EvtSchedTick) {
            this._onSchedTick(body as TickBody);
        }
    }

    private _onSchedTick(tick: TickBody) {
        this.elapsed += tick.elapsed;
        if (this.doing) return;

        if (this.elapsed >= PM2FlushMediator.FLSUH_INTERVAL) {
            this.elapsed = 0;

            this.doing = true;
            shelljs.exec("pm2 flush", { silent: true });
            this.doing = false;
        }
    }
}

export default PM2FlushMediator;