namespace NaaS {

    interface NagesenControllerState {
        rooms: {
            [key: number]: {
                sessionID: string;
                countOfCoin: number;
                countOfDis: number;
                lastSavedTime: number;
            }
        }
    }

    const KeyOfControllerStateStore = 'naas.controller.state';

    class NagesenControllerController {
        public countOfLike: number;
        public countOfDis: number;
        public title: string;
        public allowDisCoin: boolean;
        public sessionID: string;

        constructor(
            $interval: ng.IIntervalService,
            private $http: ng.IHttpService,
            private tweeter: TweetService
        ) {
            this.$http = $http;

            this.sessionID = '';
            this.countOfLike = 0;
            this.countOfDis = 0;

            let state = this.loadStateWithSweepOld();
            let room = state.rooms[_app.roomNumber] || null;
            if (room !== null) {
                this.sessionID = room.sessionID;
                this.countOfLike = room.countOfCoin;
                this.countOfDis = room.countOfDis;
            }

            this.refreshContext()
            $interval(() => this.refreshContext(), 3000);
        }

        public countUpCoin(price: number): void {
            this.countOfLike += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: CoinType.Like });
            this.saveState();
        }

        public countUpDis(price: number): void {
            this.countOfDis += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: CoinType.Dis });
            this.saveState();
        }

        private loadState(): NagesenControllerState {
            let stateJsonStr = localStorage.getItem(KeyOfControllerStateStore);
            let state = (stateJsonStr !== null ? angular.fromJson(stateJsonStr) : { rooms: {} }) as NagesenControllerState;
            return state;
        }

        private saveState(): void {
            let state = this.loadState();
            state.rooms[_app.roomNumber] = {
                sessionID: this.sessionID,
                countOfCoin: this.countOfLike,
                countOfDis: this.countOfDis,
                lastSavedTime: Date.now()
            };
            localStorage.setItem(KeyOfControllerStateStore, angular.toJson(state));
        }

        private loadStateWithSweepOld(): NagesenControllerState {
            let state = this.loadState();
            let keysToSweep = [] as string[];
            let now = Date.now();
            for (let key in state.rooms) {
                if (!state.rooms.hasOwnProperty(key)) continue;
                let room = state.rooms[key];
                if ((now - room.lastSavedTime) > 10 * 24 * 60 * 60 * 1000) { // 10 days before
                    keysToSweep.push(key);
                }
            }
            keysToSweep.forEach(key => {
                delete state.rooms[key];
            });
            localStorage.setItem(KeyOfControllerStateStore, angular.toJson(state));
            return state;
        }

        public tweet(): void {
            this.tweeter.openTweet(TweetType.FromController, this, _app.apiBaseUrl);
        }

        private refreshContext(): void {
            this.$http
                .get<RoomContextSummary>(location.pathname + '/PeekRoomContext')
                .then(e => {
                    this.title = e.data.title;
                    this.allowDisCoin = e.data.allowDisCoin;
                    if (this.sessionID !== e.data.sessionID) {
                        if (this.sessionID !== '') {
                            this.countOfLike = 0;
                            this.countOfDis = 0;
                        }
                        this.sessionID = e.data.sessionID;
                    }
                });
        }
    }

    var theApp = angular.module('theApp', []);
    theApp.controller('controllerController', ['$interval', '$http', 'tweeter', NagesenControllerController]);
}

$(() => {
    $('img.coin').on('click', e => {
        $(e.target)
            .removeClass()
            .addClass('slideOutUp animated')
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                $(this).removeClass();
            });
    });
    $(document)
        .on('touchmove touchend gesturestart gesturechange gestureend', e => { e.preventDefault(); })
        .on('touchstart', function (e) {
            e.preventDefault();
            $(e.target).click();
        });
});