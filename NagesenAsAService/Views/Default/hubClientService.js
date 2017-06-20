var NaaS;
(function (NaaS) {
    var HubClientService = (function () {
        function HubClientService(roomContext, $rootScope) {
            var _this = this;
            this.roomContext = roomContext;
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
            this.hub.on('UpdatedSettings', function (newSettings) {
                $rootScope.$apply(function () {
                    roomContext.title = newSettings.title;
                    roomContext.twitterHashtag = newSettings.twitterHashtag;
                    roomContext.allowDisCoin = newSettings.allowDisCoin;
                });
            });
            this.hub.on('ResetedRoom', function (newSessionID) {
                $rootScope.$apply(function () {
                    roomContext.sessionID = newSessionID;
                    roomContext.countOfLike = 0;
                    roomContext.countOfDis = 0;
                });
            });
            this.startHubConnection(hubConn);
        }
        HubClientService.prototype.startHubConnection = function (hubConn) {
            var _this = this;
            hubConn.start()
                .then(function () { return _this.hub.invoke('EnterRoom', _app.roomNumber); })
                .then(function (context) { return _this.$rootScope.$apply(function () {
                angular.copy(context, _this.roomContext);
            }); });
        };
        return HubClientService;
    }());
    NaaS.HubClientService = HubClientService;
    angular.module('theApp').service('hubClient', ['roomContext', '$rootScope', HubClientService]);
})(NaaS || (NaaS = {}));
//# sourceMappingURL=hubClientService.js.map