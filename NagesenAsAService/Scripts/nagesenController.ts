namespace NaaS {

    interface NagesenControllerState {
        rooms: {
            [key: number]: {
                sessionID: string;
                countOfLike: number;
                countOfDis: number;
                lastSavedTime: number;
            } | undefined;
        }
    }

    const KeyOfControllerStateStore = 'naas.controller.state';

    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };

    class NagesenControllerController {

        roomEntered: boolean = false;

        roomContextSummary: RoomContextSummary = {
            sessionID: '',
            title: '',
            allowDisCoin: false,
            twitterHashtag: '',
            unitOfLikeCoin: '',
            unitOfDisCoin: ''
        };

        countOfLike: number = 0;
        countOfDis: number = 0;

        controllerHolderElement!: HTMLElement;
        sessionTitleElement!: HTMLElement;
        coinsContainerElement!: HTMLElement;
        countOfLikeElement!: HTMLElement;
        unitOfLikeElement!: HTMLElement;
        countOfDisElement!: HTMLElement;
        unitOfDisElement!: HTMLElement;

        autoFire: boolean = false; // FOR DEBUG: Auto Fire mode
        autoFireInterval: number = 100;
        autoFireTimer: number = -1;

        constructor(
            private urlService: UrlService,
            private hubConn: HubConnectionService,
            private tweeter: TweetService
        ) {
            this.init();
            this.update();
        }

        init(): void {

            this.controllerHolderElement = document.getElementById('controller-holder')!;
            this.sessionTitleElement = document.getElementById('session-title')!;
            this.coinsContainerElement = document.getElementById('coins-container')!;

            document.getElementById('like-coin-image')!.addEventListener('click', () => this.countUpLike(10));
            document.getElementById('dis-coin-image')!.addEventListener('click', () => this.countUpDis(10));

            this.countOfLikeElement = document.getElementById('count-of-like')!;
            this.unitOfLikeElement = document.getElementById('unit-of-like')!;
            this.countOfDisElement = document.getElementById('count-of-dis')!;
            this.unitOfDisElement = document.getElementById('unit-of-dis')!;
            document.getElementById('tweet-score-button')!.addEventListener('click', () => this.onClickTweetScoreButton());

            ['touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'].forEach(eventType => {
                document.addEventListener(eventType, e => { e.preventDefault(); })
            });
            document.addEventListener('touchstart', e => {
                e.preventDefault();
                (e.srcElement as HTMLElement).click();
            })

            // Wireup the animation of coins.
            const coinAnimationCssClass = 'slideOutUp';
            document.querySelectorAll('.coin img').forEach(element => {
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
                this.roomContextSummary.sessionID = room.sessionID;
                this.countOfLike = room.countOfLike;
                this.countOfDis = room.countOfDis;
            }

            this.hubConn.onConnected(() => this.onHubConnectedAsync());
            this.hubConn.onUpdatedRoomSettings(args => this.onUpdatedRoomSettings(args));
            this.hubConn.onResetedScore(newSessionId => this.onResetedScore(newSessionId));
        }

        update(): void {
            this.controllerHolderElement.classList.toggle('room-entered', this.roomEntered);
            this.controllerHolderElement.classList.toggle('has-title', this.roomContextSummary.title !== '');
            this.sessionTitleElement.textContent = this.roomContextSummary.title;
            this.coinsContainerElement.classList.toggle('deny-dis-coin', !this.roomContextSummary.allowDisCoin);
            this.countOfLikeElement.textContent = '' + this.countOfLike;
            this.unitOfLikeElement.textContent = '' + this.roomContextSummary.unitOfLikeCoin;
            this.countOfDisElement.textContent = '' + this.countOfDis;
            this.unitOfDisElement.textContent = '' + this.roomContextSummary.unitOfDisCoin;
        }

        async onHubConnectedAsync(): Promise<void> {
            this.roomContextSummary = await this.hubConn.enterRoomAsControllerAsync(this.urlService.roomNumber);

            // Supress CSS transitions before entering the room.
            if (this.roomEntered === false) {
                setTimeout(() => {
                    this.roomEntered = true;
                    this.update();
                }, 100);
            }

            this.update();
        }


        loadState(): NagesenControllerState {
            const stateJsonStr = localStorage.getItem(KeyOfControllerStateStore);
            let state = (stateJsonStr !== null ? JSON.parse(stateJsonStr) : { rooms: {} }) as NagesenControllerState;
            return state;
        }

        saveState(): void {
            const state = this.loadState();
            state.rooms[this.urlService.roomNumber] = {
                sessionID: this.roomContextSummary.sessionID,
                countOfLike: this.countOfLike,
                countOfDis: this.countOfDis,
                lastSavedTime: Date.now()
            };
            localStorage.setItem(KeyOfControllerStateStore, JSON.stringify(state));
        }

        loadStateWithSweepOld(): NagesenControllerState {
            const state = this.loadState();
            const keysToSweep = [] as string[];
            const now = Date.now();
            for (let key in state.rooms) {
                if (!state.rooms.hasOwnProperty(key)) continue;
                const room = state.rooms[key]!;
                if ((now - room.lastSavedTime) > 10 * 24 * 60 * 60 * 1000) { // 10 days before
                    keysToSweep.push(key);
                }
            }
            keysToSweep.forEach(key => {
                delete state.rooms[key as any];
            });
            localStorage.setItem(KeyOfControllerStateStore, JSON.stringify(state));
            return state;
        }

        onUpdatedRoomSettings(args: RoomContextSummary): void {
            if (this.roomContextSummary.sessionID !== args.sessionID) {
                this.countOfLike = 0;
                this.countOfDis = 0;
            }
            this.roomContextSummary = args;
            this.update();
            this.saveState();
        }

        onResetedScore(newSessionId: string): void {
            this.roomContextSummary.sessionID = newSessionId;
            this.countOfLike = 0;
            this.countOfDis = 0;
            this.update();
            this.saveState();
        }

        async countUpLike(price: number): Promise<void> {
            await this.countUp(CoinType.Like, () => this.countOfLike += price);
        }

        async countUpDis(price: number): Promise<void> {
            await this.countUp(CoinType.Dis, () => this.countOfDis += price);
        }

        async countUp(typeOfCoin: CoinType, callback: () => void): Promise<void> {

            if (this.autoFireTimer !== -1) {
                clearInterval(this.autoFireTimer);
                this.autoFireTimer = -1;
                return;
            }
            else if (this.autoFire) {
                this.autoFireTimer = setInterval(() => { this.countUpInternal(typeOfCoin, callback); }, this.autoFireInterval) as any;
            }

            await this.countUpInternal(typeOfCoin, callback);
        }

        private throwing: boolean = false;

        async countUpInternal(typeOfCoin: CoinType, callback: () => void): Promise<void> {
            if (this.throwing === true) return;

            try {
                this.throwing = true;
                const success = await this.hubConn.throwCoinAsync(this.urlService.roomNumber, typeOfCoin);
                if (success === false) return;

                callback();
                this.saveState();
                this.update();

            } finally {
                this.throwing = false;
            }
        }

        onClickTweetScoreButton(): void {
            this.tweeter.tweetScore(TweetType.FromController, this.roomContextSummary, this.countOfLike, this.countOfDis);
        }
    }

    export const nagesenControllerController = new NagesenControllerController(
        urlService,
        hubConnService,
        tweetService);
}