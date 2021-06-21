namespace NaaS {
    export class RoomContextService {

        private _roomContext: RoomContext = {
            title: '',
            countOfLike: 0,
            countOfDis: 0,
            allowDisCoin: false,
            sessionID: '',
            twitterHashtag: '',
            unitOfLikeCoin: '',
            unitOfDisCoin: '',
            isOwnedByCurrentUser: false
        };

        public get roomContext(): RoomContext { return this._roomContext; }

        private changeListeners: (((invoker?: any) => void)[]) = [];


        private _roomEntered: Promise<void>;

        private _roomEnteredResolver!: (a: void) => void;

        public get roomEntered(): Promise<void> { return this._roomEntered; }

        constructor(
            private urlService: UrlService,
            private hubConn: HubConnectionService
        ) {

            this._roomEntered = new Promise<void>((resolve) => this._roomEnteredResolver = resolve);

            this.hubConn.onUpdatedRoomSettings(args => this.onUpdatedRoomSettings(args));
            this.hubConn.onResetedScore(newSessionId => this.onResetedScore(newSessionId));
            this.hubConn.onConnected(() => this.onHubConnectedAsync());
        }

        public update(action?: (context: RoomContext) => void, invoker?: any) {
            if (typeof (action) !== 'undefined') action(this._roomContext);
            this.changeListeners.forEach(listener => listener(invoker));
        }

        public subscribeChanges(listener: (invoker?: any) => void): void {
            this.changeListeners.push(listener);
        }

        private async onHubConnectedAsync(): Promise<void> {
            this._roomContext = await this.hubConn.enterRoomAsBoxAsync(this.urlService.roomNumber);
            this._roomEnteredResolver();
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