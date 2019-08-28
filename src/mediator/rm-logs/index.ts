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
    private static CLEAN_INTERVAL = 12 * 60 * 60 * 1000;

    private observer: IObserver;
    private rmElapsed: number;
    private rmdoing: boolean;
    private cleanElapsed: number;
    private cleandoing: boolean;
    constructor(facade: IFacade, aName: string, private dappDir: string) {
        super(aName, facade);

        this.observer = new Observer(this._onNotification, this);
        this.rmElapsed = 0;
        this.rmdoing = false;
        this.cleanElapsed = 0;
        this.cleandoing = false;
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
        this.rmElapsed += tick.elapsed;
        this.cleanElapsed += tick.elapsed;

        if (!this.rmdoing && this.rmElapsed >= RmLogsMediator.RM_INTERVAL) {
            this.rmElapsed = 0;
            this.rmdoing = true;
            this._rmUnneededLogs();
            this.rmdoing = false;
        }

        if (!this.cleandoing && this.cleanElapsed >= RmLogsMediator.CLEAN_INTERVAL) {
            this.cleanElapsed = 0;
            this.cleandoing = true;
            this._cleanLogsContent();
            this.cleandoing = false;
        }
    }

    private get LogsDir(): string {
        return path.resolve(this.dappDir, "logs");
    }

    private get LogsDate(): string {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
        return `${y.toString().padStart(4, "0")}${m.toString().padStart(2, "0")}${d.toString().padStart(2, "0")}`;
    }

    private get LogDateTime(): string {
        const now = new Date();
        const y = String(now.getFullYear()).padStart(4, "0");
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const h = String(now.getHours()).padStart(2, "0");
        const M = String(now.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${d} ${h}:${M}`;
    }

    private _cleanLogsContent() {
        if (!fs.existsSync(this.LogsDir)) {
            console.log(`[${this.LogDateTime} ${this.Name}] ` + "dir not exists");
            return;
        }
        const files = fs.readdirSync(this.LogsDir);
        files.forEach(filename => {
            const filepath = path.join(this.LogsDir, filename);
            if (fileexists.sync(filepath) && /^debug.\d*.log$/.test(filename)) {
                shelljs.exec(`echo "" > ${filepath}`, { silent: true });
                console.log(`[${this.LogDateTime} ${this.Name}] clean file[${filename}]`);
            }
        });
    }

    private _rmUnneededLogs() {
        if (!fs.existsSync(this.LogsDir)) {
            console.log(`[${this.LogDateTime} ${this.Name}] ` + "dir not exists");
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
                console.log(`[${this.LogDateTime} ${this.Name}] rm file[${filename}]`);
            }
        });
    }
}

export default RmLogsMediator;