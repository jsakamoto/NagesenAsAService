"use strict";
var NaaS;
(function (NaaS) {
    class HubConnectionService {
        constructor() {
            this.onConnectedCallBacks = [];
            this.init();
        }
        async init() {
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl("/naashub")
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();
            this.connection.onclose(() => this.onCloseConnection());
            this.connection.onreconnected(() => this.onReconnectedConnection());
            await this.startAsync();
        }
        async startAsync() {
            try {
                await this.connection.start();
                this.onReconnectedConnection();
            }
            catch (e) {
                console.error(e);
                setTimeout(() => this.startAsync(), 1000);
            }
        }
        onCloseConnection() {
            setTimeout(() => this.startAsync(), 1000);
        }
        onReconnectedConnection() {
            this.onConnectedCallBacks.forEach(callback => { callback(); });
        }
        onConnected(callback) {
            this.onConnectedCallBacks.push(callback);
            if (this.connection.state === signalR.HubConnectionState.Connected)
                callback();
        }
        enterRoomAsync(roomNumber) {
            return this.connection.invoke('EnterRoom', roomNumber);
        }
        onThrow(callback) {
            this.connection.on('Throw', callback);
        }
    }
    NaaS.HubConnectionService = HubConnectionService;
    NaaS.hubConnService = new HubConnectionService();
})(NaaS || (NaaS = {}));
