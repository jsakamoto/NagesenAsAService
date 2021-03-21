"use strict";
var NaaS;
(function (NaaS) {
    class HubConnectionService {
        constructor() {
            this.onConnectedCallBacks = [];
            this.init();
        }
        get connected() { return this.connection.state === signalR.HubConnectionState.Connected; }
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
            if (this.connected)
                callback();
        }
        enterRoomAsBoxAsync(roomNumber) {
            return this.connection.invoke('EnterRoomAsBoxAsync', roomNumber);
        }
        enterRoomAsControllerAsync(roomNumber) {
            return this.connection.invoke('EnterRoomAsControllerAsync', roomNumber);
        }
        async updateRoomSettingsAsync(roomNumber, roomSettings) {
            if (!this.connected)
                return;
            await this.connection.invoke('UpdateRoomSettingsAsync', roomNumber, roomSettings);
        }
        onThrow(callback) {
            this.connection.on('Throw', callback);
        }
        onUpdatedRoomSettings(callback) {
            this.connection.on('UpdatedRoomSettings', callback);
        }
    }
    NaaS.HubConnectionService = HubConnectionService;
    NaaS.hubConnService = new HubConnectionService();
})(NaaS || (NaaS = {}));
