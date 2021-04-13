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
        tweetScore(tweetType, context, countOfLike, countOfDis) {
            let title = context.title || '';
            title = title == '' ? 'この枠' : `「${title}」`;
            const col = context.countOfLike || countOfLike || 0;
            const cod = context.countOfDis || countOfDis || 0;
            const text = tweetType == 0 ?
                `${title}に${col}円分の投げ銭` +
                    (context.allowDisCoin ? `と${cod}Dis` : '') +
                    `が集まりました☆` :
                `${title}に${col}円分の投げ銭` +
                    (context.allowDisCoin ? `と${cod}Dis` : '') +
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
