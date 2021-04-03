namespace NaaS {

    class NagesenBoxController {

        private get roomContext(): RoomContext { return this.roomContextService.roomContext; }

        private countOfLikeElement!: HTMLElement;
        private countOfDisElement!: HTMLElement;
        private boxElement!: HTMLElement;
        private titleElement!: HTMLElement;

        private coinAssets: CoinAsset[] = [
            new CoinAsset(CoinType.Like, '/images/like-coin.png', 20, null),
            new CoinAsset(CoinType.Dis, '/images/dis-coin.png', 15, null)
        ];

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

        private update(): void {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;
        }

        private onClickTweetScoreButton(): void {
            this.tweeter.tweetScore(TweetType.FromBox, this.roomContext);
        }

        private onBeforeUnload(e: BeforeUnloadEvent): string {
            e.preventDefault();
            return e.returnValue = NaaS.localize.IfYouLeaveThisPageYouLostCoinsImage;
        }

        private onThrowCoin(args: ThrowCoinEventArgs): void {
            console.log('onThrowCoin', args);
            this.roomContext.countOfLike = args.countOfLike;
            this.roomContext.countOfDis = args.countOfDis;
            this.update();

            this.OnEnqueueThrowing(args);
        }

        private OnEnqueueThrowing(data: ThrowCoinEventArgs) {

            let coinAsset = this.coinAssets[data.typeOfCoin];
            if (coinAsset.seUrl != null) (new Audio(coinAsset.seUrl)).play();

            //this.$scope.$apply(() => {
            //    this.roomContext.countOfLike = Math.max(this.roomContext.countOfLike, data.countOfLike);
            //    this.roomContext.countOfDis = Math.max(this.roomContext.countOfDis, data.countOfDis);
            //});

            //    // ボックスが満杯と判定されていたら、効果音の再生とコイン数の表示更新だけとして、コイン投入のアニメーションはスキップする。
            //    if (this.boxIsFull) {

            //        // ※ただしコイン数表示の更新は発生するので、スクリーンショットの再取得を行う
            //        if (this.debounceTakingScreenShotId != null) clearTimeout(this.debounceTakingScreenShotId);
            //        this.debounceTakingScreenShotId = setTimeout(() => {
            //            this.debounceTakingScreenShotId = null;
            //            this.takeScreenShot();
            //        }, 5000);

            //        return;
            //    }

            //    let radius = coinAsset.radius;
            //    this.createCoin({
            //        x: radius + (0 | ((this.worldWidth - 2 * radius) * data.throwPoint)),
            //        y: -radius,
            //        a: 0,
            //        t: coinAsset.coinType
            //    });

            //    this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
        }
    }

    export const nagesenBoxController = new NagesenBoxController(
        roomContextService,
        urlService,
        hubConnService,
        tweetService);
}