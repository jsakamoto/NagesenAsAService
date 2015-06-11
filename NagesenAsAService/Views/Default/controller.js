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
            this.$http.put(location.pathname + '/throw', { typeOfCoin: NaaS.CoinType.Like }).then(function (e) { return _this.$scope.allowDisCoin = e.data.allowDisCoin; });
        };
        NagesenControllerController.prototype.countUpDis = function (price) {
            var _this = this;
            this.$scope.countOfDis += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: NaaS.CoinType.Dis }).then(function (e) { return _this.$scope.allowDisCoin = e.data.allowDisCoin; });
        };
        NagesenControllerController.prototype.tweet = function () {
            var text = ("この枠に" + this.$scope.countOfCoin + "円分の投げ銭") + (this.$scope.allowDisCoin ? "と" + this.$scope.countOfDis + "Dis" : '') + "をしました☆";
            var url = _app.apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.apiBaseUrl + '/screenshot');
            window.open(url);
        };
        return NagesenControllerController;
    })();
    var theApp = angular.module('theApp', []);
    theApp.controller('controllerController', NagesenControllerController);
})(NaaS || (NaaS = {}));
$(function () {
    $('img.coin').on('click', function (e) {
        $(e.target).removeClass().addClass('slideOutUp animated').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
            $(this).removeClass();
        });
    });
    $(document).on('touchmove touchend gesturestart gesturechange gestureend', function (e) {
        e.preventDefault();
    }).on('touchstart', function (e) {
        e.preventDefault();
        $(e.target).click();
    });
});
//# sourceMappingURL=controller.js.map