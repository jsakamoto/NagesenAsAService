namespace NaaS {

    export const enum TweetType {
        FromBox,
        FromController
    }

    export class TweetService {

        constructor(private urlService: UrlService) {
        }

        public tweetToShare(): void {
            const text = `投げ銭 as a Service - Room ${this.urlService.roomNumber} に今すぐアクセス☆`;
            this.tweet(text, this.urlService.controllerUrl);
        }

        public tweetToPrice(tweetType: TweetType, context: {
            title: string,
            countOfLike: number,
            countOfDis: number,
            allowDisCoin: boolean,
            sessionID: string
        }): void {

            let title = context.title || '';
            title = title == '' ? 'この枠' : `「${title}」`;

            const text = tweetType == TweetType.FromBox ?
                `${title}に${context.countOfLike}円分の投げ銭` +
                (context.allowDisCoin ? `と${context.countOfDis}Dis` : '') +
                `が集まりました☆` :
                `${title}に${context.countOfLike}円分の投げ銭` +
                (context.allowDisCoin ? `と${context.countOfDis}Dis` : '') +
                `をしました☆`;
            const url = this.urlService.apiBaseUrl + '/screenshot/' + context.sessionID;

            this.tweet(text, url);
        }

        private tweet(text: string, url: string): void {
            let tweetApiUrl = this.urlService.apiBaseUrl + '/TwitterShare?';
            tweetApiUrl += 'text=' + encodeURIComponent(text);
            tweetApiUrl += '&url=' + encodeURIComponent(url);
            window.open(tweetApiUrl);
        }
    }

    export const tweetService = new TweetService(urlService);
}