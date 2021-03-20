"use strict";
var NaaS;
(function (NaaS) {
    class TweetService {
        constructor(urlService) {
            this.urlService = urlService;
        }
        tweetToShare() {
            const text = `投げ銭 as a Service - Room ${this.urlService.roomNumber} に今すぐアクセス☆`;
            this.tweet(text, this.urlService.controllerUrl);
        }
        tweetToPrice(tweetType, context) {
            let title = context.title || '';
            title = title == '' ? 'この枠' : `「${title}」`;
            const text = tweetType == 0 ?
                `${title}に${context.countOfLike}円分の投げ銭` +
                    (context.allowDisCoin ? `と${context.countOfDis}Dis` : '') +
                    `が集まりました☆` :
                `${title}に${context.countOfLike}円分の投げ銭` +
                    (context.allowDisCoin ? `と${context.countOfDis}Dis` : '') +
                    `をしました☆`;
            const url = this.urlService.apiBaseUrl + '/screenshot/' + context.sessionID;
            this.tweet(text, url);
        }
        tweet(text, url) {
            let tweetApiUrl = this.urlService.apiBaseUrl + '/TwitterShare?';
            tweetApiUrl += 'text=' + encodeURIComponent(text);
            tweetApiUrl += '&url=' + encodeURIComponent(url);
            window.open(tweetApiUrl);
        }
    }
    NaaS.TweetService = TweetService;
    NaaS.tweetService = new TweetService(NaaS.urlService);
})(NaaS || (NaaS = {}));
