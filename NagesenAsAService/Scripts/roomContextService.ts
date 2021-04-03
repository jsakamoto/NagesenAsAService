namespace NaaS {
    export class RoomContextService {

        private _roomContext: RoomContext = {
            title: '',
            countOfLike: 0,
            countOfDis: 0,
            allowDisCoin: false,
            sessionID: '',
            twitterHashtag: ''
        };

        public get roomContext(): RoomContext { return this._roomContext; }

        private changeListeners: ((() => void)[]) = [];

        constructor(
            private urlService: UrlService,
            private hubConn: HubConnectionService
        ) {
            this.hubConn.onUpdatedRoomSettings(args => this.onUpdatedRoomSettings(args));
            this.hubConn.onResetedScore(newSessionId => this.onResetedScore(newSessionId));
            this.hubConn.onConnected(() => this.onHubConnectedAsync());
        }

        public update(action?: (context: RoomContext) => void) {
            if (typeof (action) !== 'undefined') action(this._roomContext);
            this.changeListeners.forEach(listener => listener());
        }

        public subscribeChanges(listener: () => void): void {
            this.changeListeners.push(listener);
        }

        private async onHubConnectedAsync(): Promise<void> {
            this._roomContext = await this.hubConn.enterRoomAsBoxAsync(this.urlService.roomNumber);
            this.update();
        }

        private onUpdatedRoomSettings(args: RoomContextSummary): void {
            this.update(context => {
                Object.assign(context, args);
            });
        }

        private onResetedScore(newSessionId: string): void {
            this.update(context => {
                context.sessionID = newSessionId;
                context.countOfLike = 0;
                context.countOfDis = 0;
            });
        }

    }

    export const roomContextService = new RoomContextService(urlService, hubConnService);
}