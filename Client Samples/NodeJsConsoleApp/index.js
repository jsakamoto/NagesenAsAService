"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signalr_1 = require("@microsoft/signalr");
const readLine = require("node:readline");
(async function () {
    console.log("投げ銭BOX as a Service に接続中...");
    const connection = new signalr_1.HubConnectionBuilder()
        .withUrl("https://naas.azurewebsites.net/naashub")
        .configureLogging(signalr_1.LogLevel.Error)
        .withAutomaticReconnect()
        .build();
    await connection.start();
    console.log("接続しました。");
    const rl = readLine.createInterface({ input: process.stdin, output: process.stdout });
    const roomNumber = parseInt(await new Promise(resolve => rl.question("4桁の「部屋番号」を入力: ", a => resolve(a))));
    rl.close();
    var roomContext = await connection.invoke("EnterRoomAsBoxAsync", roomNumber);
    console.log(`部屋番号 ${roomNumber} に入室しました。`);
    console.log(`- Like 銭: ${roomContext.countOfLike}`);
    console.log(`- Dis 銭 : ${roomContext.countOfDis}`);
    console.log("投げ銭投入の通知を受信します。");
    connection.on("Throw", async (args) => {
        console.log(`${CoinType[args.typeOfCoin]} 銭が投入されました。`);
        console.log(`- Like 銭: ${args.countOfLike}`);
        console.log(`- Dis 銭 : ${args.countOfDis}`);
    });
    console.log("投げ銭を待機中。止めるには Ctrl + C を押して下さい。");
    await new Promise(resolve => { process.on("SIGINT", () => { resolve(); }); });
    console.log("切断中...");
    await connection.stop();
    console.log("切断しました。");
})();
;
var CoinType;
(function (CoinType) {
    CoinType[CoinType["Like"] = 0] = "Like";
    CoinType[CoinType["Dis"] = 1] = "Dis";
})(CoinType || (CoinType = {}));
;
