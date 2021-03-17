"use strict";
var NaaS;
(function (NaaS) {
    class TweetService {
        constructor() {
        }
        openTweet(tweetType, context, apiBaseUrl) {
            let title = context.title || '';
            title = title == '' ? 'この枠' : `「${title}」`;
            let text = tweetType == 0 ?
                `${title}に${context.countOfLike}円分の投げ銭` +
                    (context.allowDisCoin ? `と${context.countOfDis}Dis` : '') +
                    `が集まりました☆` :
                `${title}に${context.countOfLike}円分の投げ銭` +
                    (context.allowDisCoin ? `と${context.countOfDis}Dis` : '') +
                    `をしました☆`;
            let url = apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(apiBaseUrl + '/screenshot/' + context.sessionID);
            window.open(url);
        }
    }
    NaaS.TweetService = TweetService;
})(NaaS || (NaaS = {}));
