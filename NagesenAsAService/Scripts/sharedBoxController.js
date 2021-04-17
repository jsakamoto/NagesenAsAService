"use strict";
var NaaS;
(function (NaaS) {
    class SharedBoxController {
        constructor(tweetService) {
            this.tweetService = tweetService;
            this.sharedBoxVisible = false;
            this.init();
            this.update();
        }
        init() {
            this.sharedBoxContainerElement = document.getElementById('share-box-container');
            document.getElementById('qr-code-icon').addEventListener('click', e => this.onClickQRCodeIcon());
            document.getElementById('share-box-container').addEventListener('click', e => this.onClickShareBoxContainer(e));
            document.getElementById('tweet-to-share-button').addEventListener('click', e => this.onClickTweetToShareButton());
        }
        update() {
            this.sharedBoxContainerElement.classList.toggle('visible', this.sharedBoxVisible);
        }
        onClickQRCodeIcon() {
            this.sharedBoxVisible = true;
            this.update();
        }
        onClickShareBoxContainer(e) {
            const src = e.srcElement;
            if (src === null)
                return;
            if (src.id === 'tweet-to-share-button')
                return;
            this.sharedBoxVisible = false;
            this.update();
        }
        onClickTweetToShareButton() {
            this.tweetService.tweetToShare();
        }
    }
    NaaS.sharedBoxController = new SharedBoxController(NaaS.tweetService);
})(NaaS || (NaaS = {}));
