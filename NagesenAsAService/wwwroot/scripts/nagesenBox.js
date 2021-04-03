"use strict";
var NaaS;
(function (NaaS) {
    class NagesenBoxController {
        constructor(roomContextService, urlService, hubConn, tweeter) {
            this.roomContextService = roomContextService;
            this.urlService = urlService;
            this.hubConn = hubConn;
            this.tweeter = tweeter;
            this.coinAssets = [
                new NaaS.CoinAsset(0, '/images/like-coin.png', 20, null),
                new NaaS.CoinAsset(1, '/images/dis-coin.png', 15, null)
            ];
            this.worldWidth = 0;
            this.worldHeight = 0;
            this.throwingBandHeight = 120;
            this.worldScale = 30.0;
            this.frameRate = 60;
            this.boxIsFull = false;
            this.init();
            this.update();
        }
        get roomContext() { return this.roomContextService.roomContext; }
        async init() {
            this.countOfLikeElement = document.getElementById('count-of-like');
            this.countOfDisElement = document.getElementById('count-of-dis');
            this.boxElement = document.getElementById('box');
            this.titleElement = document.getElementById('session-title');
            const tweetScoreButton = document.getElementById('tweet-score-button');
            if (tweetScoreButton !== null)
                tweetScoreButton.addEventListener('click', e => this.onClickTweetScoreButton());
            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));
            this.hubConn.onThrow(args => this.onThrowCoin(args));
            this.roomContextService.subscribeChanges(() => this.update());
            this.worker = new Worker('/scripts/nagesenBox.worker.js');
            this.worker.addEventListener('message', e => this.onWorkerMessage(e));
            this.update();
        }
        update() {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;
        }
        onClickTweetScoreButton() {
            this.tweeter.tweetScore(0, this.roomContext);
        }
        onBeforeUnload(e) {
            e.preventDefault();
            return e.returnValue = NaaS.localize.IfYouLeaveThisPageYouLostCoinsImage;
        }
        onThrowCoin(args) {
            console.log('onThrowCoin', args);
            this.worker.postMessage({ cmd: 'Enqueue', args });
        }
        onWorkerMessage(e) {
            switch (e.data.cmd) {
                case 'Interval':
                    break;
                case 'Enqueue':
                    this.onEnqueueThrowing(e.data.args);
                    break;
            }
        }
        onEnqueueThrowing(args) {
            let coinAsset = this.coinAssets[args.typeOfCoin];
            if (coinAsset.seUrl != null)
                (new Audio(coinAsset.seUrl)).play();
            this.roomContext.countOfLike = Math.max(this.roomContext.countOfLike, args.countOfLike);
            this.roomContext.countOfDis = Math.max(this.roomContext.countOfDis, args.countOfDis);
            this.update();
            this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
        }
    }
    NaaS.nagesenBoxController = new NagesenBoxController(NaaS.roomContextService, NaaS.urlService, NaaS.hubConnService, NaaS.tweetService);
})(NaaS || (NaaS = {}));
