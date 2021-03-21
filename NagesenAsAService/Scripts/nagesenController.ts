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

        roomContextSummary: RoomContextSummary = {
            sessionID: '',
            title: '',
            allowDisCoin: false,
            twitterHashtag: ''
        };

        countOfLike: number = 0;
        countOfDis: number = 0;

        controllerHolderElement!: HTMLElement;
        sessionTitleElement!: HTMLElement;
        itemsElement!: HTMLElement;
        countOfLikeElement!: HTMLElement;
        countOfDisElement!: HTMLElement;

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
            this.itemsElement = document.getElementById('items')!;

            document.getElementById('coin-image')!.addEventListener('click', () => this.countUpLike(10));
            document.getElementById('stone-image')!.addEventListener('click', () => this.countUpDis(10));

            this.countOfLikeElement = document.getElementById('count-of-like')!;
            this.countOfDisElement = document.getElementById('count-of-dis')!;
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
            document.querySelectorAll('img.coin').forEach(element => {
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
        }

        update(): void {
            this.controllerHolderElement.classList.toggle('has-title', this.roomContextSummary.title !== '');
            this.sessionTitleElement.textContent = this.roomContextSummary.title;
            this.itemsElement.classList.toggle('allow', this.roomContextSummary.allowDisCoin);
            this.itemsElement.classList.toggle('deny', !this.roomContextSummary.allowDisCoin);
            this.countOfLikeElement.textContent = '' + this.countOfLike;
            this.countOfDisElement.textContent = '' + this.countOfDis;
        }

        async onHubConnectedAsync(): Promise<void> {
            this.roomContextSummary = await this.hubConn.enterRoomAsControllerAsync(this.urlService.roomNumber);
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
        }

        async countUpLike(price: number): Promise<void> {
            this.countOfLike += price;
            await this.countUp(CoinType.Like);
        }

        async countUpDis(price: number): Promise<void> {
            this.countOfDis += price;
            await this.countUp(CoinType.Dis);
        }

        async countUp(typeOfCoin: CoinType): Promise<void> {
            await fetch(this.urlService.apiBaseUrl + '/coin', {
                method: 'POST',
                headers,
                body: JSON.stringify({ typeOfCoin })
            });
            this.saveState();
            this.update();
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