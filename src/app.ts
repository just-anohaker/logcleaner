import AppFacade from "./facade/app-facade";

function main() {
    const facade = AppFacade.getInstance();

    facade.appReady();

    process.on("uncaughtException", () => { });
    process.on("unhandledRejection", () => { });
    process.on("rejectionHandled", () => { });
}

main();