"use strict";
var NaaS;
(function (NaaS) {
    class SharedBoxController {
        constructor() {
            this.sharedBoxVisible = false;
            this.init();
            this.update();
        }
        init() {
            this.sharedBoxContainerElement = document.getElementById('share-box-container');
            document.getElementById('qr-code-icon').addEventListener('click', e => this.onClickQRCodeIcon());
            document.getElementById('share-box-container').addEventListener('click', e => this.onClickShareBoxContainer(e));
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
            if (src.id === 'buttonTweet')
                return;
            this.sharedBoxVisible = false;
            this.update();
        }
    }
    NaaS.sharedBoxController = new SharedBoxController();
})(NaaS || (NaaS = {}));
