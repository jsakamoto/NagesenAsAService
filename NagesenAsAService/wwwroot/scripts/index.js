"use strict";
var connection = new signalR.HubConnectionBuilder()
    .withUrl("/testhub")
    .configureLogging(signalR.LogLevel.Information)
    .build();
async function start() {
    try {
        await connection.start();
        console.log("SignalR Connected!");
    }
    catch (err) {
        console.log(err);
        setTimeout(start, 5000);
    }
}
;
connection.onclose(start);
connection.on('ReceiveText', onReceiveText);
start();
const buttonElement = document.getElementById('button');
if (buttonElement !== null) {
    buttonElement.addEventListener('click', onClickButton);
}
async function onClickButton(e) {
    console.log('clicked!');
    if (connection.state === signalR.HubConnectionState.Connected) {
        try {
            await connection.invoke('SendText', 'woo:' + (new Date().getTime()));
            console.log('message sent!');
        }
        catch (err) {
            console.error(err);
        }
    }
}
function onReceiveText(text) {
    console.log('onReceiveText! text: ' + text);
}
