var NaaS;
(function (NaaS) {
    var RoomStateService = (function () {
        function RoomStateService() {
            this.countOfLike = 0;
            this.countOfDis = 0;
        }
        return RoomStateService;
    }());
    NaaS.RoomStateService = RoomStateService;
    angular.module('theApp').service('roomState', [RoomStateService]);
})(NaaS || (NaaS = {}));
//# sourceMappingURL=RoomStateService.js.map