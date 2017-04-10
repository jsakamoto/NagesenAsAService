var NaaS;
(function (NaaS) {
    var KeyOfControllerStateStore = 'naas.controller.state';
    var NagesenControllerController = (function () {
        function NagesenControllerController($http, $interval) {
            var _this = this;
            this.$http = $http;
            this.sessionID = '';
            this.countOfCoin = 0;
            this.countOfDis = 0;
            var state = this.loadStateWithSweepOld();
            var room = state.rooms[_app.roomNumber] || null;
            if (room !== null) {
                this.sessionID = room.sessionID;
                this.countOfCoin = room.countOfCoin;
                this.countOfDis = room.countOfDis;
            }
            this.refreshContext();
            $interval(function () { return _this.refreshContext(); }, 3000);
        }
        NagesenControllerController.prototype.countUpCoin = function (price) {
            this.countOfCoin += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: 0 /* Like */ });
            this.saveState();
        };
        NagesenControllerController.prototype.countUpDis = function (price) {
            this.countOfDis += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: 1 /* Dis */ });
            this.saveState();
        };
        NagesenControllerController.prototype.loadState = function () {
            var stateJsonStr = localStorage.getItem(KeyOfControllerStateStore);
            var state = (stateJsonStr !== null ? angular.fromJson(stateJsonStr) : { rooms: {} });
            return state;
        };
        NagesenControllerController.prototype.saveState = function () {
            var state = this.loadState();
            state.rooms[_app.roomNumber] = {
                sessionID: this.sessionID,
                countOfCoin: this.countOfCoin,
                countOfDis: this.countOfDis,
                lastSavedTime: Date.now()
            };
            localStorage.setItem(KeyOfControllerStateStore, angular.toJson(state));
        };
        NagesenControllerController.prototype.loadStateWithSweepOld = function () {
            var state = this.loadState();
            var keysToSweep = [];
            var now = Date.now();
            for (var key in state.rooms) {
                if (!state.rooms.hasOwnProperty(key))
                    continue;
                var room = state.rooms[key];
                if ((now - room.lastSavedTime) > 10 * 24 * 60 * 60 * 1000) {
                    keysToSweep.push(key);
                }
            }
            keysToSweep.forEach(function (key) {
                delete state.rooms[key];
            });
            localStorage.setItem(KeyOfControllerStateStore, angular.toJson(state));
            return state;
        };
        NagesenControllerController.prototype.tweet = function () {
            var text = "\u3053\u306E\u67A0\u306B" + this.countOfCoin + "\u5186\u5206\u306E\u6295\u3052\u92AD" +
                (this.allowDisCoin ? "\u3068" + this.countOfDis + "Dis" : '') +
                "\u3092\u3057\u307E\u3057\u305F\u2606";
            var url = _app.apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.apiBaseUrl + '/screenshot/' + this.sessionID);
            window.open(url);
        };
        NagesenControllerController.prototype.refreshContext = function () {
            var _this = this;
            this.$http
                .get(location.pathname + '/PeekRoomContext')
                .then(function (e) {
                _this.allowDisCoin = e.data.allowDisCoin;
                if (_this.sessionID !== e.data.sessionID) {
                    if (_this.sessionID !== '') {
                        _this.countOfCoin = 0;
                        _this.countOfDis = 0;
                    }
                    _this.sessionID = e.data.sessionID;
                }
            });
        };
        return NagesenControllerController;
    }());
    var theApp = angular.module('theApp', []);
    theApp.controller('controllerController', ['$http', '$interval', NagesenControllerController]);
})(NaaS || (NaaS = {}));
$(function () {
    $('img.coin').on('click', function (e) {
        $(e.target)
            .removeClass()
            .addClass('slideOutUp animated')
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            $(this).removeClass();
        });
    });
    $(document)
        .on('touchmove touchend gesturestart gesturechange gestureend', function (e) { e.preventDefault(); })
        .on('touchstart', function (e) {
        e.preventDefault();
        $(e.target).click();
    });
});
//# sourceMappingURL=controller.js.map