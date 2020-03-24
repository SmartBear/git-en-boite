import "reflect-metadata";
import {createConnection} from "typeorm";
import {ClientApp} from "./entity/ClientApp";

createConnection().then(async connection => {

    console.log("Inserting a new user into the database...");
    const app = new ClientApp();
    app.name = "Timber";
    app.id = "Saw";
    await connection.manager.save(app);
    console.log("Saved a new ClientApp with id: " + app.id);

    console.log("Loading apps from the database...");
    const apps = await connection.manager.find(ClientApp);
    console.log("Loaded apps: ", apps);

    console.log("Here you can setup and run express/koa/any other framework.");

}).catch(error => console.log(error));
