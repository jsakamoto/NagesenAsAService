namespace NaaS {
    class SharedBoxController {

        sharedBoxVisible: boolean = false;

        sharedBoxContainerElement!: HTMLElement;

        constructor(
            private tweetService: TweetService
        ) {
            this.init();
            this.update();
        }

        init(): void {
            this.sharedBoxContainerElement = document.getElementById('share-box-container')!;
            document.getElementById('qr-code-icon')!.addEventListener('click', e => this.onClickQRCodeIcon());
            document.getElementById('share-box-container')!.addEventListener('click', e => this.onClickShareBoxContainer(e));
            document.getElementById('tweet-to-share-button')!.addEventListener('click', e => this.onClickTweetToShareButton());
        }

        update(): void {
            this.sharedBoxContainerElement.classList.toggle('visible', this.sharedBoxVisible);
        }

        onClickQRCodeIcon(): void {
            this.sharedBoxVisible = true;
            this.update();
        }

        onClickShareBoxContainer(e: Event): void {
            const src = e.srcElement as HTMLElement | null;
            if (src === null) return;
            if (src.id === 'tweet-to-share-button') return;

            this.sharedBoxVisible = false;
            this.update();
        }

        onClickTweetToShareButton(): void {
            this.tweetService.tweetToShare();
        }
    }

    export const sharedBoxController = new SharedBoxController(tweetService);
}