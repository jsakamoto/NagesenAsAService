"use strict";
var NaaS;
(function (NaaS) {
    class NagesenBoxController {
        constructor(urlService, hubConn, tweeter) {
            this.urlService = urlService;
            this.hubConn = hubConn;
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
            this.settingsContainerElement = null;
            this.titleInputElement = null;
            this.twitterHashtagInputElement = null;
            this.allowDisCoinInputElement = null;
            this.init();
            this.update();
        }
        async init() {
            this.countOfLikeElement = document.getElementById('count-of-like');
            this.countOfDisElement = document.getElementById('count-of-dis');
            this.boxElement = document.getElementById('box');
            this.titleElement = document.getElementById('session-title');
            const settingButtonElement = document.getElementById('settings-button');
            if (settingButtonElement !== null)
                settingButtonElement.addEventListener('click', e => this.onClickSettingButton());
            this.settingsContainerElement = document.getElementById('settings-container');
            this.titleInputElement = document.getElementById('session-title-input');
            this.twitterHashtagInputElement = document.getElementById('twitter-hashtag-input');
            this.allowDisCoinInputElement = document.getElementById('allow-dis-coin-input');
            if (this.titleInputElement !== null)
                this.titleInputElement.addEventListener('input', e => this.onInputTitle());
            if (this.twitterHashtagInputElement !== null)
                this.twitterHashtagInputElement.addEventListener('input', e => this.onInputTwitterHashtag());
            if (this.allowDisCoinInputElement !== null)
                this.allowDisCoinInputElement.addEventListener('change', e => this.onChageAllowDisCoin());
            const resetRoomButton = document.getElementById('reset-room-button');
            if (resetRoomButton !== null)
                resetRoomButton.addEventListener('click', e => this.onClickResetRoomButton());
            const tweetScoreButton = document.getElementById('tweet-score-button');
            if (tweetScoreButton !== null)
                tweetScoreButton.addEventListener('click', e => this.onClickTweetScoreButton());
            const settingsMask = document.getElementById('settings-mask');
            if (settingsMask !== null)
                settingsMask.addEventListener('click', e => this.onClickSettingsMask());
            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));
            this.hubConn.onThrow(args => this.onThrowCoin(args));
            this.hubConn.onUpdatedRoomSettings(args => this.onUpdatedRoomSettings(args));
            this.hubConn.onResetedScore(newSessionId => this.onResetedScore(newSessionId));
            this.hubConn.onConnected(() => this.onHubConnectedAsync());
            this.update();
        }
        update() {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;
            if (this.settingsContainerElement !== null &&
                this.titleInputElement !== null &&
                this.twitterHashtagInputElement !== null &&
                this.allowDisCoinInputElement !== null) {
                this.settingsContainerElement.classList.toggle('visible', this.visibleSettings);
                if (this.titleInputElement.value !== this.roomContext.title)
                    this.titleInputElement.value = this.roomContext.title;
                if (this.twitterHashtagInputElement.value !== this.roomContext.twitterHashtag)
                    this.twitterHashtagInputElement.value = this.roomContext.twitterHashtag || '';
                if (this.allowDisCoinInputElement.checked !== this.roomContext.allowDisCoin)
                    this.allowDisCoinInputElement.checked = this.roomContext.allowDisCoin;
            }
            this.hubConn.updateRoomSettingsAsync(this.urlService.roomNumber, this.roomContext);
        }
        async onHubConnectedAsync() {
            this.roomContext = await this.hubConn.enterRoomAsBoxAsync(this.urlService.roomNumber);
            this.update();
        }
        onClickSettingButton() {
            this.visibleSettings = !this.visibleSettings;
            this.update();
        }
        onInputTitle() {
            if (this.titleInputElement === null)
                return;
            this.roomContext.title = this.titleInputElement.value;
            this.update();
        }
        onInputTwitterHashtag() {
            if (this.twitterHashtagInputElement === null)
                return;
            this.roomContext.twitterHashtag = this.twitterHashtagInputElement.value;
            this.update();
        }
        onChageAllowDisCoin() {
            if (this.allowDisCoinInputElement === null)
                return;
            this.roomContext.allowDisCoin = this.allowDisCoinInputElement.checked;
            this.update();
        }
        async onClickResetRoomButton() {
            const res = confirm(NaaS.localize.ConfirmResetRoom);
            if (res === true) {
                await this.hubConn.resetScoreAsync(this.urlService.roomNumber);
            }
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
        onThrowCoin(args) {
            console.log('onThrowCoin', args);
            this.roomContext.countOfLike = args.countOfLike;
            this.roomContext.countOfDis = args.countOfDis;
            this.update();
        }
        onUpdatedRoomSettings(args) {
            Object.assign(this.roomContext, args);
            this.update();
        }
        onResetedScore(newSessionId) {
            this.roomContext.sessionID = newSessionId;
            this.roomContext.countOfLike = 0;
            this.roomContext.countOfDis = 0;
            this.update();
        }
    }
    NaaS.nagesenBoxController = new NagesenBoxController(NaaS.urlService, NaaS.hubConnService, NaaS.tweetService);
})(NaaS || (NaaS = {}));
