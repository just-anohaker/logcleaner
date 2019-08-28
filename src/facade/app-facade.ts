import { Facade, IFacade } from "pure-framework";

import AppEvents from "../config/events";

import { DiceDapp, SugramDapp } from "../config/config";

// proxies
import SchedProxy from "../proxy/sched";
// mediators
import RmLogsMediator from "../mediator/rm-logs";

class AppFacade extends Facade implements IFacade {
    private static instance?: AppFacade;

    static getInstance(): AppFacade {
        if (AppFacade.instance === undefined) {
            AppFacade.instance = new AppFacade();

            AppFacade.instance._initProxies();
            AppFacade.instance._initMediators();
        }

        return AppFacade.instance!;
    }

    constructor() {
        super();
    }

    appReady() {
        this.sendNotification(AppEvents.EvtAppReady);
    }

    private _initProxies() {
        this.registerProxy(new SchedProxy(this));
    }

    private _initMediators() {
        this.registerMediator(new RmLogsMediator(this, "rm_dice_logs_mediator", DiceDapp));
        this.registerMediator(new RmLogsMediator(this, "rm_sugram_logs_mediator", SugramDapp));
    }
}

export default AppFacade;