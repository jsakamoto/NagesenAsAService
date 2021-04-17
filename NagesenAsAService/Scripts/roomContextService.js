"use strict";
var NaaS;
(function (NaaS) {
    class RoomContextService {
        constructor(urlService, hubConn) {
            this.urlService = urlService;
            this.hubConn = hubConn;
            this._roomContext = {
                title: '',
                countOfLike: 0,
                countOfDis: 0,
                allowDisCoin: false,
                sessionID: '',
                twitterHashtag: '',
                isOwnedByCurrentUser: false
            };
            this.changeListeners = [];
            this._roomEntered = new Promise((resolve) => this._roomEnteredResolver = resolve);
            this.hubConn.onUpdatedRoomSettings(args => this.onUpdatedRoomSettings(args));
            this.hubConn.onResetedScore(newSessionId => this.onResetedScore(newSessionId));
            this.hubConn.onConnected(() => this.onHubConnectedAsync());
        }
        get roomContext() { return this._roomContext; }
        get roomEntered() { return this._roomEntered; }
        update(action, invoker) {
            if (typeof (action) !== 'undefined')
                action(this._roomContext);
            this.changeListeners.forEach(listener => listener(invoker));
        }
        subscribeChanges(listener) {
            this.changeListeners.push(listener);
        }
        async onHubConnectedAsync() {
            this._roomContext = await this.hubConn.enterRoomAsBoxAsync(this.urlService.roomNumber);
            this._roomEnteredResolver();
            this.update();
        }
        onUpdatedRoomSettings(args) {
            this.update(context => {
                Object.assign(context, args);
            });
        }
        onResetedScore(newSessionId) {
            this.update(context => {
                context.sessionID = newSessionId;
                context.countOfLike = 0;
                context.countOfDis = 0;
            });
        }
    }
    NaaS.RoomContextService = RoomContextService;
    NaaS.roomContextService = new RoomContextService(NaaS.urlService, NaaS.hubConnService);
})(NaaS || (NaaS = {}));
