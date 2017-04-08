var NaaS;
(function (NaaS) {
    var RoomContextService = (function () {
        function RoomContextService() {
            this.roomNumber = 0;
            this.sessionID = '';
            this.title = '';
            this.twitterHashtag = '';
            this.allowDisCoin = false;
            this.countOfLike = 0;
            this.countOfDis = 0;
        }
        return RoomContextService;
    }());
    NaaS.RoomContextService = RoomContextService;
    angular.module('theApp').service('roomContext', [RoomContextService]);
})(NaaS || (NaaS = {}));
//# sourceMappingURL=RoomContextService.js.map