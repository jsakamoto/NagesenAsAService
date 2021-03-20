"use strict";
var NaaS;
(function (NaaS) {
    const KeyOfControllerStateStore = 'naas.controller.state';
    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    class NagesenControllerController {
        constructor(urlService, tweeter) {
            this.urlService = urlService;
            this.tweeter = tweeter;
            this.title = '';
            this.sessionID = '';
            this.countOfLike = 0;
            this.countOfDis = 0;
            this.allowDisCoin = false;
            this.init();
            this.update();
        }
        init() {
            this.controllerHolderElement = document.getElementById('controller-holder');
            this.sessionTitleElement = document.getElementById('session-title');
            this.itemsElement = document.getElementById('items');
            document.getElementById('coin-image').addEventListener('click', () => this.countUpLike(10));
            document.getElementById('stone-image').addEventListener('click', () => this.countUpDis(10));
            this.countOfLikeElement = document.getElementById('count-of-like');
            this.countOfDisElement = document.getElementById('count-of-dis');
            document.getElementById('tweet-to-price-button').addEventListener('click', () => this.onClickTweetToPrice());
            ['touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'].forEach(eventType => {
                document.addEventListener(eventType, e => { e.preventDefault(); });
            });
            document.addEventListener('touchstart', e => {
                e.preventDefault();
                e.srcElement.click();
            });
            const coinAnimationCssClass = 'slideOutUp';
            document.querySelectorAll('img.coin').forEach(element => {
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
                this.sessionID = room.sessionID;
                this.countOfLike = room.countOfLike;
                this.countOfDis = room.countOfDis;
            }
            this.refreshContext();
            setInterval(() => this.refreshContext(), 3000);
        }
        update() {
            this.controllerHolderElement.classList.toggle('has-title', this.title !== '');
            this.sessionTitleElement.textContent = this.title;
            this.itemsElement.classList.toggle('allow', this.allowDisCoin);
            this.itemsElement.classList.toggle('deny', !this.allowDisCoin);
            this.countOfLikeElement.textContent = '' + this.countOfLike;
            this.countOfDisElement.textContent = '' + this.countOfDis;
        }
        loadState() {
            const stateJsonStr = localStorage.getItem(KeyOfControllerStateStore);
            let state = (stateJsonStr !== null ? JSON.parse(stateJsonStr) : { rooms: {} });
            return state;
        }
        saveState() {
            const state = this.loadState();
            state.rooms[this.urlService.roomNumber] = {
                sessionID: this.sessionID,
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
        async refreshContext() {
            const response = await fetch(this.urlService.apiBaseUrl + '/context', { method: 'GET', headers });
            if (!response.ok)
                throw new Error();
            const roomContextSummary = await response.json();
            this.title = roomContextSummary.title;
            this.allowDisCoin = roomContextSummary.allowDisCoin;
            if (this.sessionID !== roomContextSummary.sessionID) {
                if (this.sessionID !== '') {
                    this.countOfLike = 0;
                    this.countOfDis = 0;
                }
                this.sessionID = roomContextSummary.sessionID;
            }
            this.update();
        }
        async countUpLike(price) {
            this.countOfLike += price;
            await this.countUp(0);
        }
        async countUpDis(price) {
            this.countOfDis += price;
            await this.countUp(1);
        }
        async countUp(typeOfCoin) {
            await fetch(this.urlService.apiBaseUrl + '/coin', {
                method: 'POST',
                headers,
                body: JSON.stringify({ typeOfCoin })
            });
            this.saveState();
            this.update();
        }
        onClickTweetToPrice() {
            this.tweeter.tweetToPrice(1, this);
        }
    }
    NaaS.nagesenControllerController = new NagesenControllerController(NaaS.urlService, NaaS.tweetService);
})(NaaS || (NaaS = {}));
