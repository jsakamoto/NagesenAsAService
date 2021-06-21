"use strict";
var NaaS;
(function (NaaS) {
    class NagesenBoxSettingsController {
        constructor(roomContextService, urlService, hubConn) {
            this.roomContextService = roomContextService;
            this.urlService = urlService;
            this.hubConn = hubConn;
            this.visibleSettings = false;
            this.settingsContainerElement = null;
            this.titleInputElement = null;
            this.twitterHashtagInputElement = null;
            this.allowDisCoinInputElement = null;
            this.unitOfLikeInputElement = null;
            this.unitOfDisInputElement = null;
            this.init();
            this.update();
        }
        get roomContext() { return this.roomContextService.roomContext; }
        init() {
            const settingButtonElement = document.getElementById('settings-button');
            if (settingButtonElement !== null)
                settingButtonElement.addEventListener('click', e => this.onClickSettingButton());
            this.settingsContainerElement = document.getElementById('settings-container');
            this.titleInputElement = document.getElementById('session-title-input');
            this.twitterHashtagInputElement = document.getElementById('twitter-hashtag-input');
            this.unitOfLikeInputElement = document.getElementById('unit-of-like-input');
            this.unitOfDisInputElement = document.getElementById('unit-of-dis-input');
            this.allowDisCoinInputElement = document.getElementById('allow-dis-coin-input');
            if (this.titleInputElement !== null)
                this.titleInputElement.addEventListener('input', e => this.onInputTitle());
            if (this.twitterHashtagInputElement !== null)
                this.twitterHashtagInputElement.addEventListener('input', e => this.onInputTwitterHashtag());
            if (this.unitOfLikeInputElement !== null)
                this.unitOfLikeInputElement.addEventListener('input', e => this.onInputUnitOfLike());
            if (this.unitOfDisInputElement !== null)
                this.unitOfDisInputElement.addEventListener('input', e => this.onInputUnitOfDis());
            if (this.allowDisCoinInputElement !== null)
                this.allowDisCoinInputElement.addEventListener('change', e => this.onChageAllowDisCoin());
            const resetRoomButton = document.getElementById('reset-room-button');
            if (resetRoomButton !== null)
                resetRoomButton.addEventListener('click', e => this.onClickResetRoomButton());
            const settingsMask = document.getElementById('settings-mask');
            if (settingsMask !== null)
                settingsMask.addEventListener('click', e => this.onClickSettingsMask());
            this.roomContextService.subscribeChanges((invoker) => this.update(invoker));
            this.update();
        }
        update(invoker) {
            if (this.settingsContainerElement !== null &&
                this.titleInputElement !== null &&
                this.twitterHashtagInputElement !== null &&
                this.unitOfLikeInputElement !== null &&
                this.unitOfDisInputElement !== null &&
                this.allowDisCoinInputElement !== null) {
                this.settingsContainerElement.classList.toggle('visible', this.visibleSettings);
                if (this === invoker)
                    return;
                if (this.titleInputElement.value !== this.roomContext.title)
                    this.titleInputElement.value = this.roomContext.title;
                if (this.twitterHashtagInputElement.value !== this.roomContext.twitterHashtag)
                    this.twitterHashtagInputElement.value = this.roomContext.twitterHashtag || '';
                if (this.unitOfLikeInputElement.value !== this.roomContext.unitOfLikeCoin)
                    this.unitOfLikeInputElement.value = this.roomContext.unitOfLikeCoin || '';
                if (this.unitOfDisInputElement.value !== this.roomContext.unitOfDisCoin)
                    this.unitOfDisInputElement.value = this.roomContext.unitOfDisCoin || '';
                if (this.allowDisCoinInputElement.checked !== this.roomContext.allowDisCoin)
                    this.allowDisCoinInputElement.checked = this.roomContext.allowDisCoin;
            }
        }
        onClickSettingButton() {
            this.visibleSettings = !this.visibleSettings;
            this.update();
        }
        onClickSettingsMask() {
            this.visibleSettings = false;
            this.update();
        }
        changeRoomSetings(action) {
            this.roomContextService.update(action, this);
            this.hubConn.updateRoomSettingsAsync(this.urlService.roomNumber, this.roomContext);
        }
        onInputTitle() {
            this.changeRoomSetings(context => {
                if (this.titleInputElement === null)
                    return;
                context.title = this.titleInputElement.value;
            });
        }
        onInputTwitterHashtag() {
            this.changeRoomSetings(context => {
                if (this.twitterHashtagInputElement === null)
                    return;
                context.twitterHashtag = this.twitterHashtagInputElement.value;
            });
        }
        onInputUnitOfLike() {
            this.changeRoomSetings(context => {
                if (this.unitOfLikeInputElement === null)
                    return;
                context.unitOfLikeCoin = this.unitOfLikeInputElement.value;
            });
        }
        onInputUnitOfDis() {
            this.changeRoomSetings(context => {
                if (this.unitOfDisInputElement === null)
                    return;
                context.unitOfDisCoin = this.unitOfDisInputElement.value;
            });
        }
        onChageAllowDisCoin() {
            this.changeRoomSetings(context => {
                if (this.allowDisCoinInputElement === null)
                    return;
                context.allowDisCoin = this.allowDisCoinInputElement.checked;
            });
        }
        async onClickResetRoomButton() {
            const res = confirm(NaaS.localize.ConfirmResetRoom);
            if (res === true) {
                await this.hubConn.resetScoreAsync(this.urlService.roomNumber);
            }
        }
        onResetedScore(newSessionId) {
            this.roomContext.sessionID = newSessionId;
            this.roomContext.countOfLike = 0;
            this.roomContext.countOfDis = 0;
            this.update();
        }
    }
    NaaS.nagesenBoxSettingsController = new NagesenBoxSettingsController(NaaS.roomContextService, NaaS.urlService, NaaS.hubConnService);
})(NaaS || (NaaS = {}));
