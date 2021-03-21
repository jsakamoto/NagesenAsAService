﻿namespace NaaS {
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
        settingsContainerElement!: HTMLElement;
        boxElement!: HTMLElement;
        titleElement!: HTMLElement;
        titleInputElement!: HTMLInputElement;
        twitterHashtagInputElement!: HTMLInputElement;
        allowDisCoinInputElement!: HTMLInputElement;

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
            this.settingsContainerElement = document.getElementById('settings-container')!;
            this.boxElement = document.getElementById('box')!;
            this.titleElement = document.getElementById('session-title')!;

            this.titleInputElement = document.getElementById('session-title-input') as HTMLInputElement;
            this.twitterHashtagInputElement = document.getElementById('twitter-hashtag-input') as HTMLInputElement;
            this.allowDisCoinInputElement = document.getElementById('allow-dis-coin-input') as HTMLInputElement;

            document.getElementById('settings-button')!.addEventListener('click', e => this.onClickSettingButton());

            this.titleInputElement.addEventListener('input', e => this.onInputTitle());
            this.twitterHashtagInputElement.addEventListener('input', e => this.onInputTwitterHashtag());
            this.allowDisCoinInputElement.addEventListener('change', e => this.onChageAllowDisCoin());
            document.getElementById('reset-room-button')!.addEventListener('click', e => this.onClickResetRoomButton());
            document.getElementById('tweet-score-button')!.addEventListener('click', e => this.onClickTweetScoreButton());
            document.getElementById('settings-mask')!.addEventListener('click', e => this.onClickSettingsMask());

            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));

            this.hubConn.onThrow(args => this.onThrowCoin(args));
            this.hubConn.onConnected(() => this.onHubConnectedAsync());

            this.update();
        }

        async onHubConnectedAsync(): Promise<void> {
            this.roomContext = await this.hubConn.enterRoomAsync(this.urlService.roomNumber);
            this.update();
        }

        update(): void {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.settingsContainerElement.classList.toggle('visible', this.visibleSettings);
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;

            if (this.titleInputElement.value !== this.roomContext.title) this.titleInputElement.value = this.roomContext.title;
            if (this.twitterHashtagInputElement.value !== this.roomContext.twitterHashtag) this.twitterHashtagInputElement.value = this.roomContext.twitterHashtag || '';
            if (this.allowDisCoinInputElement.checked !== this.roomContext.allowDisCoin) this.allowDisCoinInputElement.checked = this.roomContext.allowDisCoin;

            console.log(this.roomContext);
        }

        onClickSettingButton(): void {
            this.visibleSettings = !this.visibleSettings;
            this.update();
        }

        onInputTitle(): void {
            this.roomContext.title = this.titleInputElement.value;
            this.update();
        }

        onInputTwitterHashtag(): void {
            this.roomContext.twitterHashtag = this.twitterHashtagInputElement.value;
            this.update();
        }

        onChageAllowDisCoin(): void {
            this.roomContext.allowDisCoin = this.allowDisCoinInputElement.checked;
            this.update();
        }

        onClickResetRoomButton(): void {
            const res = confirm(NaaS.localize.ConfirmResetRoom);
            console.log('reset', res);
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
        }
    }

    export const nagesenBoxController = new NagesenBoxController(
        urlService,
        hubConnService,
        tweetService);
}