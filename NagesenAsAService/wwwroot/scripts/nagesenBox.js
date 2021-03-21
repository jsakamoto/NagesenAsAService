"use strict";
var NaaS;
(function (NaaS) {
    class NagesenBoxController {
        constructor(urlService, tweeter) {
            this.urlService = urlService;
            this.tweeter = tweeter;
            this.roomContext = {
                title: '',
                countOfLike: 0,
                countOfDis: 0,
                allowDisCoin: false,
                sessionID: '',
                twitterHashtag: ''
            };
            this.visibleSettings = false;
            this.init();
            this.update();
        }
        init() {
            this.countOfLikeElement = document.getElementById('count-of-like');
            this.countOfDisElement = document.getElementById('count-of-dis');
            this.settingsContainerElement = document.getElementById('settings-container');
            this.boxElement = document.getElementById('box');
            this.titleElement = document.getElementById('session-title');
            this.titleInputElement = document.getElementById('session-title-input');
            this.twitterHashtagInputElement = document.getElementById('twitter-hashtag-input');
            this.allowDisCoinInputElement = document.getElementById('allow-dis-coin-input');
            document.getElementById('settings-button').addEventListener('click', e => this.onClickSettingButton());
            this.titleInputElement.addEventListener('input', e => this.onInputTitle());
            this.twitterHashtagInputElement.addEventListener('input', e => this.onInputTwitterHashtag());
            this.allowDisCoinInputElement.addEventListener('change', e => this.onChageAllowDisCoin());
            document.getElementById('reset-room-button').addEventListener('click', e => this.onClickResetRoomButton());
            document.getElementById('tweet-score-button').addEventListener('click', e => this.onClickTweetScoreButton());
            document.getElementById('settings-mask').addEventListener('click', e => this.onClickSettingsMask());
            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));
            this.update();
        }
        update() {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.settingsContainerElement.classList.toggle('visible', this.visibleSettings);
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;
            if (this.titleInputElement.value !== this.roomContext.title)
                this.titleInputElement.value = this.roomContext.title;
            if (this.twitterHashtagInputElement.value !== this.roomContext.twitterHashtag)
                this.twitterHashtagInputElement.value = this.roomContext.twitterHashtag || '';
            if (this.allowDisCoinInputElement.checked !== this.roomContext.allowDisCoin)
                this.allowDisCoinInputElement.checked = this.roomContext.allowDisCoin;
            console.log(this.roomContext);
        }
        onClickSettingButton() {
            this.visibleSettings = !this.visibleSettings;
            this.update();
        }
        onInputTitle() {
            this.roomContext.title = this.titleInputElement.value;
            this.update();
        }
        onInputTwitterHashtag() {
            this.roomContext.twitterHashtag = this.twitterHashtagInputElement.value;
            this.update();
        }
        onChageAllowDisCoin() {
            this.roomContext.allowDisCoin = this.allowDisCoinInputElement.checked;
            this.update();
        }
        onClickResetRoomButton() {
            const res = confirm(NaaS.localize.ConfirmResetRoom);
            console.log('reset', res);
        }
        onClickTweetScoreButton() {
            this.tweeter.tweetScore(0, this.roomContext);
        }
        onClickSettingsMask() {
            this.visibleSettings = false;
            this.update();
        }
        onBeforeUnload(e) {
            e.preventDefault();
            return e.returnValue = NaaS.localize.IfYouLeaveThisPageYouLostCoinsImage;
        }
    }
    NaaS.nagesenBoxController = new NagesenBoxController(NaaS.urlService, NaaS.tweetService);
})(NaaS || (NaaS = {}));
