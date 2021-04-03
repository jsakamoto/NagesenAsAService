"use strict";
var NaaS;
(function (NaaS) {
    class NagesenBoxController {
        constructor(roomContextService, urlService, hubConn, tweeter) {
            this.roomContextService = roomContextService;
            this.urlService = urlService;
            this.hubConn = hubConn;
            this.tweeter = tweeter;
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
            this.roomContext.countOfLike = args.countOfLike;
            this.roomContext.countOfDis = args.countOfDis;
            this.update();
        }
    }
    NaaS.nagesenBoxController = new NagesenBoxController(NaaS.roomContextService, NaaS.urlService, NaaS.hubConnService, NaaS.tweetService);
})(NaaS || (NaaS = {}));
