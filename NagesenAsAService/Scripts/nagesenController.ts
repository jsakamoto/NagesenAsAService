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

        roomNumber: number = 0;
        title: string = '';
        sessionID: string = '';
        countOfLike: number = 0;
        countOfDis: number = 0;
        allowDisCoin: boolean = false;

        controllerHolderElement!: HTMLElement;
        sessionTitleElement!: HTMLElement;
        itemsElement!: HTMLElement;
        countOfLikeElement!: HTMLElement;
        countOfDisElement!: HTMLElement;

        apiBaseUrl: string = '';

        constructor(private tweeter: TweetService) {
            this.init();
            this.update();
        }

        init(): void {
            this.roomNumber = parseInt(location.pathname.split('/')[2]);
            this.apiBaseUrl = location.origin + '/api/rooms/' + this.roomNumber;

            this.controllerHolderElement = document.getElementById('controller-holder')!;
            this.sessionTitleElement = document.getElementById('session-title')!;
            this.itemsElement = document.getElementById('items')!;

            document.getElementById('coin-image')!.addEventListener('click', () => this.countUpLike(10));
            document.getElementById('stone-image')!.addEventListener('click', () => this.countUpDis(10));

            this.countOfLikeElement = document.getElementById('count-of-like')!;
            this.countOfDisElement = document.getElementById('count-of-dis')!;
            document.getElementById('buttonTweet')!.addEventListener('click', () => this.tweet());

            ['touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'].forEach(eventType => {
                document.addEventListener(eventType, e => { e.preventDefault(); })
            });
            document.addEventListener('touchstart', e => {
                e.preventDefault();
                (e.srcElement as HTMLElement).click();
            })

            // todo:
            //$('img.coin').on('click', e => {
            //    $(e.target)
            //        .removeClass()
            //        .addClass('slideOutUp animated')
            //        .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            //            $(this).removeClass();
            //        });
            //});

            const state = this.loadStateWithSweepOld();
            const room = state.rooms[this.roomNumber] || null;
            if (room !== null) {
                this.sessionID = room.sessionID;
                this.countOfLike = room.countOfLike;
                this.countOfDis = room.countOfDis;
            }

            this.refreshContext()
            setInterval(() => this.refreshContext(), 3000);
        }

        update(): void {
            this.controllerHolderElement.classList.toggle('has-title', this.title !== '');
            this.sessionTitleElement.textContent = this.title;
            this.itemsElement.classList.toggle('allow', this.allowDisCoin);
            this.itemsElement.classList.toggle('deny', !this.allowDisCoin);
            this.countOfLikeElement.textContent = '' + this.countOfLike;
            this.countOfDisElement.textContent = '' + this.countOfDis;
        }

        loadState(): NagesenControllerState {
            const stateJsonStr = localStorage.getItem(KeyOfControllerStateStore);
            let state = (stateJsonStr !== null ? JSON.parse(stateJsonStr) : { rooms: {} }) as NagesenControllerState;
            return state;
        }

        saveState(): void {
            const state = this.loadState();
            state.rooms[this.roomNumber] = {
                sessionID: this.sessionID,
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

        async refreshContext(): Promise<void> {

            const response = await fetch(this.apiBaseUrl + '/context', { method: 'GET', headers });
            if (!response.ok) throw new Error();
            const roomContextSummary = await response.json() as RoomContextSummary;

            this.title = roomContextSummary.title;
            this.allowDisCoin = roomContextSummary.allowDisCoin;
            if (this.sessionID !== roomContextSummary.sessionID) {
                if (this.sessionID !== '') {
                    this.countOfLike = 0;
                    this.countOfDis = 0;
                }
                this.sessionID = roomContextSummary.sessionID;
            }

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
            await fetch(this.apiBaseUrl + '/throw', {
                method: 'PUT',
                headers,
                body: JSON.stringify({ typeOfCoin: CoinType.Dis })
            });
            this.saveState();
            this.update();
        }

        tweet(): void {
            this.tweeter.openTweet(TweetType.FromController, this, this.apiBaseUrl);
        }
    }

    export var controller: any = new NagesenControllerController(
        new TweetService());
}