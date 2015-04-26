module NaaS {
    const enum CoinType {
        Like,
        Dis
    }

    interface INagesenControllerScope extends ng.IScope {
        countOfCoin: number;
        countOfDis: number;
    }

    class NagesenControllerController {
        $scope: INagesenControllerScope;
        $http: ng.IHttpService;
        constructor($scope: INagesenControllerScope, $http: ng.IHttpService) {
            this.$scope = $scope;
            this.$scope.countOfCoin = 0;
            this.$scope.countOfDis = 0;
            this.$http = $http;
        }

        public countUpCoin(price: number): void {
            this.$scope.countOfCoin += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: CoinType.Like });
        }

        public countUpDis(price: number): void {
            this.$scope.countOfDis += price;
            this.$http.put(location.pathname + '/throw', { typeOfCoin: CoinType.Dis });
        }

        public resetCounter(): void {
            if (!confirm('投げ銭とDisをリセットしますか？')) {
                return;
            }
            this.$scope.countOfCoin = 0;
            this.$scope.countOfDis = 0;
        }

        public tweet(): void {
            var text = `この枠に${this.$scope.countOfCoin}円分の投げ銭と${this.$scope.countOfDis}Disをしました☆`;
            var url = 'https://twitter.com/share?';
            url += 'text=' + encodeURIComponent(text);
            this.$http
                .get(location.pathname + '/TwitterHashtag')
                .success(data => {
                url += '&hashtags=' + encodeURIComponent((<any>data).twitterHashtag);
                window.open(url, 'tweet');
            });
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