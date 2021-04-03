namespace NaaS {
    class NagesenBoxController {

        private get roomContext(): RoomContext { return this.roomContextService.roomContext; }

        private countOfLikeElement!: HTMLElement;
        private countOfDisElement!: HTMLElement;
        private boxElement!: HTMLElement;
        private titleElement!: HTMLElement;

        constructor(
            private roomContextService: RoomContextService,
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

            const tweetScoreButton = document.getElementById('tweet-score-button');
            if (tweetScoreButton !== null) tweetScoreButton.addEventListener('click', e => this.onClickTweetScoreButton());

            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));
            this.hubConn.onThrow(args => this.onThrowCoin(args));
            this.roomContextService.subscribeChanges(() => this.update());
            this.update();
        }

        update(): void {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;
        }

        onClickTweetScoreButton(): void {
            this.tweeter.tweetScore(TweetType.FromBox, this.roomContext);
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
    }

    export const nagesenBoxController = new NagesenBoxController(
        roomContextService,
        urlService,
        hubConnService,
        tweetService);
}