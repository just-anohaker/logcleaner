import fs = require("fs");
import path = require("path");
import { Mediator, IMediator } from "pure-framework";
import { IFacade, INotification, IObserver, Observer } from "pure-framework";
import shelljs from "shelljs";
import fileexists from "file-exists";

import AppEvents from "../../config/events";
import { TickBody } from "../../config/types";

class RmLogsMediator extends Mediator implements IMediator {
    private static RM_INTERVAL = 24 * 60 * 60 * 1000;

    private observer: IObserver;
    private elapsed: number;
    constructor(facade: IFacade, aName: string, private dappDir: string) {
        super(aName, facade);

        this.observer = new Observer(this._onNotification, this);
        this.elapsed = 0;
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

        if (this.elapsed >= RmLogsMediator.RM_INTERVAL) {
            this.elapsed = 0;
            this._rmUnneededLogs();
        }

        this._cleanLogsContent();
    }

    private get LogsDir(): string {
        return path.resolve(this.dappDir, "logs");
    }

    private get LogsDate(): string {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
        return `${y.toString().padStart(4, "0")}${m.toString().padStart(2, "0")}${d.toString().padStart(2, "0")}`;
    }

    private _cleanLogsContent() {
        if (!fs.existsSync(this.LogsDir)) {
            console.log("dir not exists");
            return;
        }
        const files = fs.readdirSync(this.LogsDir);
        files.forEach(filename => {
            const filepath = path.join(this.LogsDir, filename);
            if (fileexists.sync(filepath) && /^debug.\d*.log$/.test(filename)) {
                shelljs.exec(`echo "" > ${filepath}`, { silent: true });
            }
        });
    }

    private _rmUnneededLogs() {
        if (!fs.existsSync(this.LogsDir)) {
            console.log("dir not exists");
            return;
        }


        const files = fs.readdirSync(this.LogsDir);
        files.forEach(filename => {
            const filepath = path.join(this.LogsDir, filename);
            if (!fileexists.sync(filepath)) {
                return;
            }
            const match = /^debug.(\d+).log$/.exec(filename);
            if (match != null && match[1] !== this.LogsDate) {
                shelljs.exec(`rm -rf ${filepath}`, { silent: true });
            }
        });
    }
}

export default RmLogsMediator;