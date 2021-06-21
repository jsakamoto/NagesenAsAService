"use strict";
var NaaS;
(function (NaaS) {
    const KeyOfControllerStateStore = 'naas.controller.state';
    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    class NagesenControllerController {
        constructor(urlService, hubConn, tweeter) {
            this.urlService = urlService;
            this.hubConn = hubConn;
            this.tweeter = tweeter;
            this.roomEntered = false;
            this.roomContextSummary = {
                sessionID: '',
                title: '',
                allowDisCoin: false,
                twitterHashtag: '',
                unitOfLikeCoin: '',
                unitOfDisCoin: ''
            };
            this.countOfLike = 0;
            this.countOfDis = 0;
            this.init();
            this.update();
        }
        init() {
            this.controllerHolderElement = document.getElementById('controller-holder');
            this.sessionTitleElement = document.getElementById('session-title');
            this.coinsContainerElement = document.getElementById('coins-container');
            document.getElementById('like-coin-image').addEventListener('click', () => this.countUpLike(10));
            document.getElementById('dis-coin-image').addEventListener('click', () => this.countUpDis(10));
            this.countOfLikeElement = document.getElementById('count-of-like');
            this.unitOfLikeElement = document.getElementById('unit-of-like');
            this.countOfDisElement = document.getElementById('count-of-dis');
            this.unitOfDisElement = document.getElementById('unit-of-dis');
            document.getElementById('tweet-score-button').addEventListener('click', () => this.onClickTweetScoreButton());
            ['touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'].forEach(eventType => {
                document.addEventListener(eventType, e => { e.preventDefault(); });
            });
            document.addEventListener('touchstart', e => {
                e.preventDefault();
                e.srcElement.click();
            });
            const coinAnimationCssClass = 'slideOutUp';
            document.querySelectorAll('.coin img').forEach(element => {
                element.addEventListener('click', e => {
                    element.classList.remove(coinAnimationCssClass);
                    element.classList.add(coinAnimationCssClass);
                });
                element.addEventListener('animationend', e => {
                    element.classList.remove(coinAnimationCssClass);
                });
            });
            const state = this.loadStateWithSweepOld();
            const room = state.rooms[this.urlService.roomNumber] || null;
            if (room !== null) {
                this.roomContextSummary.sessionID = room.sessionID;
                this.countOfLike = room.countOfLike;
                this.countOfDis = room.countOfDis;
            }
            this.hubConn.onConnected(() => this.onHubConnectedAsync());
            this.hubConn.onUpdatedRoomSettings(args => this.onUpdatedRoomSettings(args));
            this.hubConn.onResetedScore(newSessionId => this.onResetedScore(newSessionId));
        }
        update() {
            this.controllerHolderElement.classList.toggle('room-entered', this.roomEntered);
            this.controllerHolderElement.classList.toggle('has-title', this.roomContextSummary.title !== '');
            this.sessionTitleElement.textContent = this.roomContextSummary.title;
            this.coinsContainerElement.classList.toggle('deny-dis-coin', !this.roomContextSummary.allowDisCoin);
            this.countOfLikeElement.textContent = '' + this.countOfLike;
            this.unitOfLikeElement.textContent = '' + this.roomContextSummary.unitOfLikeCoin;
            this.countOfDisElement.textContent = '' + this.countOfDis;
            this.unitOfDisElement.textContent = '' + this.roomContextSummary.unitOfDisCoin;
        }
        async onHubConnectedAsync() {
            this.roomContextSummary = await this.hubConn.enterRoomAsControllerAsync(this.urlService.roomNumber);
            if (this.roomEntered === false) {
                setTimeout(() => {
                    this.roomEntered = true;
                    this.update();
                }, 100);
            }
            this.update();
        }
        loadState() {
            const stateJsonStr = localStorage.getItem(KeyOfControllerStateStore);
            let state = (stateJsonStr !== null ? JSON.parse(stateJsonStr) : { rooms: {} });
            return state;
        }
        saveState() {
            const state = this.loadState();
            state.rooms[this.urlService.roomNumber] = {
                sessionID: this.roomContextSummary.sessionID,
                countOfLike: this.countOfLike,
                countOfDis: this.countOfDis,
                lastSavedTime: Date.now()
            };
            localStorage.setItem(KeyOfControllerStateStore, JSON.stringify(state));
        }
        loadStateWithSweepOld() {
            const state = this.loadState();
            const keysToSweep = [];
            const now = Date.now();
            for (let key in state.rooms) {
                if (!state.rooms.hasOwnProperty(key))
                    continue;
                const room = state.rooms[key];
                if ((now - room.lastSavedTime) > 10 * 24 * 60 * 60 * 1000) {
                    keysToSweep.push(key);
                }
            }
            keysToSweep.forEach(key => {
                delete state.rooms[key];
            });
            localStorage.setItem(KeyOfControllerStateStore, JSON.stringify(state));
            return state;
        }
        onUpdatedRoomSettings(args) {
            if (this.roomContextSummary.sessionID !== args.sessionID) {
                this.countOfLike = 0;
                this.countOfDis = 0;
            }
            this.roomContextSummary = args;
            this.update();
            this.saveState();
        }
        onResetedScore(newSessionId) {
            this.roomContextSummary.sessionID = newSessionId;
            this.countOfLike = 0;
            this.countOfDis = 0;
            this.update();
            this.saveState();
        }
        async countUpLike(price) {
            await this.countUp(0, () => this.countOfLike += price);
        }
        async countUpDis(price) {
            await this.countUp(1, () => this.countOfDis += price);
        }
        async countUp(typeOfCoin, callback) {
            const success = await this.hubConn.throwCoinAsync(this.urlService.roomNumber, typeOfCoin);
            if (success === false)
                return;
            callback();
            this.saveState();
            this.update();
        }
        onClickTweetScoreButton() {
            this.tweeter.tweetScore(1, this.roomContextSummary, this.countOfLike, this.countOfDis);
        }
    }
    NaaS.nagesenControllerController = new NagesenControllerController(NaaS.urlService, NaaS.hubConnService, NaaS.tweetService);
})(NaaS || (NaaS = {}));
