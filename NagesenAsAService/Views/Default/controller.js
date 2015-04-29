var NaaS;
(function (NaaS) {
    var NagesenControllerController = (function () {
        function NagesenControllerController($scope, $http) {
            this.$scope = $scope;
            this.$scope.countOfCoin = 0;
            this.$scope.countOfDis = 0;
            this.$http = $http;
        }
        NagesenControllerController.prototype.countUpCoin = function (price) {
            this.$scope.countOfCoin += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: 0 /* Like */ });
        };
        NagesenControllerController.prototype.countUpDis = function (price) {
            this.$scope.countOfDis += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: 1 /* Dis */ });
        };
        NagesenControllerController.prototype.resetCounter = function () {
            if (!confirm('投げ銭とDisをリセットしますか？')) {
                return;
            }
            this.$scope.countOfCoin = 0;
            this.$scope.countOfDis = 0;
        };
        NagesenControllerController.prototype.tweet = function () {
            var text = "この枠に" + this.$scope.countOfCoin + "円分の投げ銭と" + this.$scope.countOfDis + "Disをしました☆";
            var url = 'https://twitter.com/share?';
            url += 'text=' + encodeURIComponent(text);
            this.$http.get(_app.twitterHashtagUrl).success(function (data) {
                url += '&hashtags=' + encodeURIComponent(data.twitterHashtag);
                window.open(url, 'tweet');
            });
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
});
//# sourceMappingURL=controller.js.map