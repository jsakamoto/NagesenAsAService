var NaaS;
(function (NaaS) {
    var HubClientService = (function () {
        function HubClientService(roomState, $rootScope) {
            var _this = this;
            this.roomState = roomState;
            this.$rootScope = $rootScope;
            var hubConn = $.hubConnection();
            // SiganlR 切断時の再接続処理を配線
            var reconnectTimer = { id: null };
            hubConn.stateChanged(function (args) {
                if (args.newState == 4 /* Disconnected */) {
                    if (reconnectTimer.id == null) {
                        reconnectTimer.id = setInterval(function () { return _this.startHubConnection(hubConn); }, 5000);
                    }
                }
                else if (reconnectTimer.id != null) {
                    clearInterval(reconnectTimer.id);
                    reconnectTimer.id = null;
                }
            });
            this.hub = hubConn.createHubProxy('DefaultHub');
            this.startHubConnection(hubConn);
        }
        HubClientService.prototype.startHubConnection = function (hubConn) {
            var _this = this;
            hubConn.start()
                .then(function () { return _this.hub.invoke('EnterRoom', _app.roomNumber); })
                .then(function (roomState) { return _this.$rootScope.$apply(function () {
                _this.roomState.countOfLike = roomState.countOfLike;
                _this.roomState.countOfDis = roomState.countOfDis;
            }); });
        };
        return HubClientService;
    }());
    NaaS.HubClientService = HubClientService;
    angular.module('theApp').service('hubClient', ['roomState', '$rootScope', HubClientService]);
})(NaaS || (NaaS = {}));
//# sourceMappingURL=hubClientService.js.map