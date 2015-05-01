/// <reference path="../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="CoinType.ts" />
module NaaS {

    interface INagesenControllerScope extends ng.IScope {
        countOfCoin: number;
        countOfDis: number;
        allowDisCoin: boolean;
    }

    class NagesenControllerController {
        $scope: INagesenControllerScope;
        $http: ng.IHttpService;
        constructor($scope: INagesenControllerScope, $http: ng.IHttpService) {
            this.$scope = $scope;
            this.$scope.countOfCoin = 0;
            this.$scope.countOfDis = 0;
            this.$scope.allowDisCoin = _app.allowDisCoin;
            this.$http = $http;
        }

        public countUpCoin(price: number): void {
            this.$scope.countOfCoin += price;
            this.$http
                .put(location.pathname + '/throw', { typeOfCoin: CoinType.Like })
                .then(e => this.$scope.allowDisCoin = (<any>e.data).allowDisCoin);
        }

        public countUpDis(price: number): void {
            this.$scope.countOfDis += price;
            this.$http
                .put(location.pathname + '/throw', { typeOfCoin: CoinType.Dis })
                .then(e => this.$scope.allowDisCoin = (<any>e.data).allowDisCoin);
        }

        public tweet(): void {
            var text =
                `この枠に${this.$scope.countOfCoin}円分の投げ銭` +
                (this.$scope.allowDisCoin ? `と${this.$scope.countOfDis}Dis` : '') +
                `をしました☆`;
            var url = _app.apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.apiBaseUrl + '/screenshot');
            window.open(url);
        }
    }

    var theApp = angular.module('theApp', []);
    theApp.controller('controllerController', NagesenControllerController);
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
});