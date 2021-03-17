namespace NaaS {

    export const enum TweetType {
        FromBox,
        FromController
    }

    export class TweetService {
        constructor() {
        }

        public openTweet(tweetType: TweetType, context: {
            title: string,
            countOfLike: number,
            countOfDis: number,
            allowDisCoin: boolean,
            sessionID: string
        }, apiBaseUrl: string): void {

            let title = context.title || '';
            title = title == '' ? 'この枠' : `「${title}」`;

            let text = tweetType == TweetType.FromBox ?
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
}