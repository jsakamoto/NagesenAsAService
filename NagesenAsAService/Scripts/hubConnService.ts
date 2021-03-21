namespace NaaS {

    export class HubConnectionService {

        private connection!: signalR.HubConnection;

        private onConnectedCallBacks: (() => void)[] = [];

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
            if (this.connection.state === signalR.HubConnectionState.Connected) callback();
        }

        public enterRoomAsync(roomNumber: number): Promise<RoomContext> {
            return this.connection.invoke<RoomContext>('EnterRoom', roomNumber);
        }

        public onThrow(callback: (args: ThrowCoinEventArgs) => void): void {
            this.connection.on('Throw', callback);
        }

    }

    export const hubConnService = new HubConnectionService();
}