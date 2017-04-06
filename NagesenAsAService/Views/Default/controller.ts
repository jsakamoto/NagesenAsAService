namespace NaaS {

    class NagesenControllerController {
        public countOfCoin: number;
        public countOfDis: number;
        public allowDisCoin: boolean;
        private $http: ng.IHttpService;

        constructor($http: ng.IHttpService) {
            this.countOfCoin = 0;
            this.countOfDis = 0;
            this.allowDisCoin = _app.allowDisCoin;
            this.$http = $http;
        }

        public countUpCoin(price: number): void {
            this.countOfCoin += price;
            this.$http
                .put(location.pathname + '/throw', { typeOfCoin: CoinType.Like })
                .then(e => this.allowDisCoin = (<any>e.data).allowDisCoin);
        }

        public countUpDis(price: number): void {
            this.countOfDis += price;
            this.$http
                .put(location.pathname + '/throw', { typeOfCoin: CoinType.Dis })
                .then(e => this.allowDisCoin = (<any>e.data).allowDisCoin);
        }

        public tweet(): void {
            var text =
                `この枠に${this.countOfCoin}円分の投げ銭` +
                (this.allowDisCoin ? `と${this.countOfDis}Dis` : '') +
                `をしました☆`;
            var url = _app.apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.apiBaseUrl + '/screenshot/' + _app.sessionId);
            window.open(url);
        }
    }

    var theApp = angular.module('theApp', []);
    theApp.controller('controllerController', ['$http', NagesenControllerController]);
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
    $(document)
        .on('touchmove touchend gesturestart gesturechange gestureend', e => { e.preventDefault(); })
        .on('touchstart', function (e) {
            e.preventDefault();
            $(e.target).click();
        });
});