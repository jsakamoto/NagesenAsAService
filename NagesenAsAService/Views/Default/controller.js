/// <reference path="../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="CoinType.ts" />
var NaaS;
(function (NaaS) {
    var NagesenControllerController = (function () {
        function NagesenControllerController($scope, $http) {
            this.$scope = $scope;
            this.$scope.countOfCoin = 0;
            this.$scope.countOfDis = 0;
            this.$scope.allowDisCoin = _app.allowDisCoin;
            this.$http = $http;
        }
        NagesenControllerController.prototype.countUpCoin = function (price) {
            var _this = this;
            this.$scope.countOfCoin += price;
            this.$http
                .put(location.pathname + '/throw', { typeOfCoin: 0 /* Like */ })
                .then(function (e) { return _this.$scope.allowDisCoin = e.data.allowDisCoin; });
        };
        NagesenControllerController.prototype.countUpDis = function (price) {
            var _this = this;
            this.$scope.countOfDis += price;
            this.$http
                .put(location.pathname + '/throw', { typeOfCoin: 1 /* Dis */ })
                .then(function (e) { return _this.$scope.allowDisCoin = e.data.allowDisCoin; });
        };
        NagesenControllerController.prototype.tweet = function () {
            var text = "\u3053\u306E\u67A0\u306B" + this.$scope.countOfCoin + "\u5186\u5206\u306E\u6295\u3052\u92AD" +
                (this.$scope.allowDisCoin ? "\u3068" + this.$scope.countOfDis + "Dis" : '') +
                "\u3092\u3057\u307E\u3057\u305F\u2606";
            var url = _app.apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.apiBaseUrl + '/screenshot/' + _app.sessionId);
            window.open(url);
        };
        return NagesenControllerController;
    }());
    var theApp = angular.module('theApp', []);
    theApp.controller('controllerController', NagesenControllerController);
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