namespace NaaS {
    class NagesenBoxController {

        roomContext: RoomContext = {
            title: '',
            countOfLike: 0,
            countOfDis: 0,
            allowDisCoin: false,
            sessionID: '',
            twitterHashtag: ''
        };

        visibleSettings: boolean = false;

        countOfLikeElement!: HTMLElement;
        countOfDisElement!: HTMLElement;
        boxElement!: HTMLElement;
        titleElement!: HTMLElement;

        settingsContainerElement: HTMLElement | null = null;
        titleInputElement: HTMLInputElement | null = null;
        twitterHashtagInputElement: HTMLInputElement | null = null;
        allowDisCoinInputElement: HTMLInputElement | null = null;

        constructor(
            private urlService: UrlService,
            private hubConn: HubConnectionService,
            private tweeter: TweetService
        ) {
            this.init();
            this.update();
        }

        async init(): Promise<void> {

            this.countOfLikeElement = document.getElementById('count-of-like')!;
            this.countOfDisElement = document.getElementById('count-of-dis')!;
            this.boxElement = document.getElementById('box')!;
            this.titleElement = document.getElementById('session-title')!;

            const settingButtonElement = document.getElementById('settings-button');
            if (settingButtonElement !== null) settingButtonElement.addEventListener('click', e => this.onClickSettingButton());

            this.settingsContainerElement = document.getElementById('settings-container');
            this.titleInputElement = document.getElementById('session-title-input') as HTMLInputElement | null;
            this.twitterHashtagInputElement = document.getElementById('twitter-hashtag-input') as HTMLInputElement | null;
            this.allowDisCoinInputElement = document.getElementById('allow-dis-coin-input') as HTMLInputElement | null;


            if (this.titleInputElement !== null) this.titleInputElement.addEventListener('input', e => this.onInputTitle());
            if (this.twitterHashtagInputElement !== null) this.twitterHashtagInputElement.addEventListener('input', e => this.onInputTwitterHashtag());
            if (this.allowDisCoinInputElement !== null) this.allowDisCoinInputElement.addEventListener('change', e => this.onChageAllowDisCoin());
            const resetRoomButton = document.getElementById('reset-room-button');
            if (resetRoomButton !== null) resetRoomButton.addEventListener('click', e => this.onClickResetRoomButton());
            const tweetScoreButton = document.getElementById('tweet-score-button');
            if (tweetScoreButton !== null) tweetScoreButton.addEventListener('click', e => this.onClickTweetScoreButton());
            const settingsMask = document.getElementById('settings-mask');
            if (settingsMask !== null) settingsMask.addEventListener('click', e => this.onClickSettingsMask());

            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));

            this.hubConn.onThrow(args => this.onThrowCoin(args));
            this.hubConn.onUpdatedRoomSettings(args => this.onUpdatedRoomSettings(args));
            this.hubConn.onResetedScore(newSessionId => this.onResetedScore(newSessionId));
            this.hubConn.onConnected(() => this.onHubConnectedAsync());

            this.update();
        }

        update(): void {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;

            if (
                this.settingsContainerElement !== null &&
                this.titleInputElement !== null &&
                this.twitterHashtagInputElement !== null &&
                this.allowDisCoinInputElement !== null
            ) {
                this.settingsContainerElement.classList.toggle('visible', this.visibleSettings);
                if (this.titleInputElement.value !== this.roomContext.title) this.titleInputElement.value = this.roomContext.title;
                if (this.twitterHashtagInputElement.value !== this.roomContext.twitterHashtag) this.twitterHashtagInputElement.value = this.roomContext.twitterHashtag || '';
                if (this.allowDisCoinInputElement.checked !== this.roomContext.allowDisCoin) this.allowDisCoinInputElement.checked = this.roomContext.allowDisCoin;
            }

            this.hubConn.updateRoomSettingsAsync(this.urlService.roomNumber, this.roomContext);
        }

        async onHubConnectedAsync(): Promise<void> {
            this.roomContext = await this.hubConn.enterRoomAsBoxAsync(this.urlService.roomNumber);
            this.update();
        }

        onClickSettingButton(): void {
            this.visibleSettings = !this.visibleSettings;
            this.update();
        }

        onInputTitle(): void {
            if (this.titleInputElement === null) return;
            this.roomContext.title = this.titleInputElement.value;
            this.update();
        }

        onInputTwitterHashtag(): void {
            if (this.twitterHashtagInputElement === null) return;
            this.roomContext.twitterHashtag = this.twitterHashtagInputElement.value;
            this.update();
        }

        onChageAllowDisCoin(): void {
            if (this.allowDisCoinInputElement === null) return;
            this.roomContext.allowDisCoin = this.allowDisCoinInputElement.checked;
            this.update();
        }

        async onClickResetRoomButton(): Promise<void> {
            const res = confirm(NaaS.localize.ConfirmResetRoom);
            if (res === true) {
                await this.hubConn.resetScoreAsync(this.urlService.roomNumber);
            }
        }

        onClickTweetScoreButton(): void {
            this.tweeter.tweetScore(TweetType.FromBox, this.roomContext);
        }

        onClickSettingsMask(): void {
            this.visibleSettings = false;
            this.update();
        }

        onBeforeUnload(e: BeforeUnloadEvent): string {
            e.preventDefault();
            return e.returnValue = NaaS.localize.IfYouLeaveThisPageYouLostCoinsImage;
        }

        onThrowCoin(args: ThrowCoinEventArgs): void {
            console.log('onThrowCoin', args);
            this.roomContext.countOfLike = args.countOfLike;
            this.roomContext.countOfDis = args.countOfDis;
            this.update();
        }

        onUpdatedRoomSettings(args: RoomContextSummary): void {
            Object.assign(this.roomContext, args);
            this.update();
        }

        onResetedScore(newSessionId: string): void {
            this.roomContext.sessionID = newSessionId;
            this.roomContext.countOfLike = 0;
            this.roomContext.countOfDis = 0;
            this.update();
        }
    }

    export const nagesenBoxController = new NagesenBoxController(
        urlService,
        hubConnService,
        tweetService);
}