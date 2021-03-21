/// <reference types="@microsoft/signalr" />

namespace NaaS {

    export class HubConnectionService {

        private connection!: signalR.HubConnection;

        private onConnectedCallBacks: (() => void)[] = [];

        private get connected(): boolean { return this.connection.state === signalR.HubConnectionState.Connected; }

        constructor() {
            this.init();
        }

        private async init(): Promise<void> {
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl("/naashub")
                .withAutomaticReconnect()
                .configureLogging(signalR.LogLevel.Information)
                .build();

            this.connection.onclose(() => this.onCloseConnection());
            this.connection.onreconnected(() => this.onReconnectedConnection())

            await this.startAsync();
        }

        private async startAsync(): Promise<void> {
            try {
                await this.connection.start();
                this.onReconnectedConnection();
            }
            catch (e) {
                console.error(e);
                setTimeout(() => this.startAsync(), 1000);
            }
        }

        private onCloseConnection(): void {
            setTimeout(() => this.startAsync(), 1000);
        }

        private onReconnectedConnection(): void {
            this.onConnectedCallBacks.forEach(callback => { callback(); });
        }

        public onConnected(callback: () => void) {
            this.onConnectedCallBacks.push(callback);
            if (this.connected) callback();
        }

        public enterRoomAsBoxAsync(roomNumber: number): Promise<RoomContext> {
            return this.connection.invoke<RoomContext>('EnterRoomAsBoxAsync', roomNumber);
        }

        public enterRoomAsControllerAsync(roomNumber: number): Promise<RoomContextSummary> {
            return this.connection.invoke<RoomContextSummary>('EnterRoomAsControllerAsync', roomNumber);
        }

        public async updateRoomSettingsAsync(roomNumber: number, roomSettings: RoomSettings): Promise<void> {
            if (!this.connected) return;
            await this.connection.invoke('UpdateRoomSettingsAsync', roomNumber, roomSettings);
        }

        public async resetScoreAsync(roomNumber: number): Promise<void> {
            if (!this.connected) return;
            await this.connection.invoke('ResetScoreAsync', roomNumber);
        }

        public async throwCoinAsync(roomNumber: number, typeOfCoin: CoinType): Promise<boolean> {
            if (!this.connected) return false;
            await this.connection.invoke('throwCoinAsync', roomNumber, typeOfCoin);
            return true;
        }

        public onThrow(callback: (args: ThrowCoinEventArgs) => void): void {
            this.connection.on('Throw', callback);
        }

        public onUpdatedRoomSettings(callback: (args: RoomContextSummary) => void): void {
            this.connection.on('UpdatedRoomSettings', callback);
        }

        public onResetedScore(callback: (newSessionId: string) => void): void {
            this.connection.on('ResetedScore', callback)
        }
    }

    export const hubConnService = new HubConnectionService();
}