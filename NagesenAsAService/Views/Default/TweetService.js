var NaaS;
(function (NaaS) {
    var TweetService = (function () {
        function TweetService() {
        }
        TweetService.prototype.openTweet = function (tweetType, context, apiBaseUrl) {
            var title = context.title || '';
            title = title == '' ? 'この枠' : "\u300C" + title + "\u300D";
            var text = tweetType == 0 /* FromBox */ ?
                title + "\u306B" + context.countOfLike + "\u5186\u5206\u306E\u6295\u3052\u92AD" +
                    (context.allowDisCoin ? "\u3068" + context.countOfDis + "Dis" : '') +
                    "\u304C\u96C6\u307E\u308A\u307E\u3057\u305F\u2606" :
                title + "\u306B" + context.countOfLike + "\u5186\u5206\u306E\u6295\u3052\u92AD" +
                    (context.allowDisCoin ? "\u3068" + context.countOfDis + "Dis" : '') +
                    "\u3092\u3057\u307E\u3057\u305F\u2606";
            var url = _app.apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.apiBaseUrl + '/screenshot/' + context.sessionID);
            window.open(url);
        };
        return TweetService;
    }());
    NaaS.TweetService = TweetService;
    var theApp = angular.module('theApp');
    theApp.service('tweeter', [TweetService]);
})(NaaS || (NaaS = {}));
//# sourceMappingURL=tweetService.js.map