"use strict";
var NaaS;
(function (NaaS) {
    class TweetService {
        constructor(urlService) {
            this.urlService = urlService;
        }
        tweetToShare() {
            const text = `投げ銭 BOX as a Service - Room ${this.urlService.roomNumber} に今すぐアクセス☆`;
            this.tweet(text, this.urlService.controllerUrl);
        }
        tweetScore(tweetType, context, countOfLike, countOfDis) {
            let title = context.title || '';
            title = title == '' ? 'この枠' : `「${title}」`;
            const col = (context.countOfLike || countOfLike || 0).toLocaleString();
            const cod = (context.countOfDis || countOfDis || 0).toLocaleString();
            const text = tweetType == 0 ?
                `${title}に ${col} ${context.unitOfLikeCoin} 分の投げ銭` +
                    (context.allowDisCoin ? `と ${cod} ${context.unitOfDisCoin}` : '') +
                    `が集まりました☆` :
                `${title} に ${col} ${context.unitOfLikeCoin} 分の投げ銭` +
                    (context.allowDisCoin ? `と ${cod} ${context.unitOfDisCoin}` : '') +
                    `をしました☆`;
            const url = this.urlService.controllerUrl + '/screenshot?' +
                `session=${context.sessionID}&` +
                `col=${col}&` +
                `cod=${cod}`;
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
