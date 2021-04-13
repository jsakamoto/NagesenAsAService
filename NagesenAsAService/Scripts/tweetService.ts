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

        public tweetScore(tweetType: TweetType, context: RoomContext | RoomContextSummary, countOfLike?: number, countOfDis?: number): void {

            let title = context.title || '';
            title = title == '' ? 'この枠' : `「${title}」`;

            const col = (context as RoomContext).countOfLike || countOfLike || 0;
            const cod = (context as RoomContext).countOfDis || countOfDis || 0;

            const text = tweetType == TweetType.FromBox ?
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

        private tweet(text: string, url: string): void {
            let tweetApiUrl = this.urlService.apiBaseUrl + '/TwitterShare?';
            tweetApiUrl += 'text=' + encodeURIComponent(text);
            tweetApiUrl += '&url=' + encodeURIComponent(url);
            window.open(tweetApiUrl);
        }
    }

    export const tweetService = new TweetService(urlService);
}