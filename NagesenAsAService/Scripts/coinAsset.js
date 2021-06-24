"use strict";
var NaaS;
(function (NaaS) {
    const resolution = 100;
    class CoinAsset {
        constructor(coinType, imageUrl, radius) {
            this.coinType = coinType;
            this.radius = radius;
            this.fixtureDef = null;
            this.rotatedImages = [];
            this.completed = false;
            this.rotatedImages = Array(resolution).fill(0).map(_ => new Image());
            this.completeAsync = new Promise(resolve => {
                const sourceImage = new Image();
                sourceImage.onload = () => {
                    var width = sourceImage.naturalWidth;
                    var height = sourceImage.naturalHeight;
                    var chouhen = (width >= height) ? width : height;
                    var canvaswidth = width;
                    var canvasheight = height;
                    const new_size = 2 * radius;
                    if (chouhen >= new_size) {
                        canvaswidth = new_size / chouhen * width;
                        canvasheight = new_size / chouhen * height;
                    }
                    const canvas0 = document.createElement('canvas');
                    canvas0.width = canvaswidth;
                    canvas0.height = canvasheight;
                    var context = canvas0.getContext("2d");
                    for (var i = 0; i < this.rotatedImages.length; i++) {
                        context.clearRect(0, 0, canvaswidth, canvasheight);
                        context.save();
                        context.translate(radius, radius);
                        context.rotate(Math.PI * 2 / resolution * i);
                        context.drawImage(sourceImage, -radius, -radius, canvaswidth, canvasheight);
                        context.restore();
                        this.rotatedImages[i].src = canvas0.toDataURL("image/png");
                    }
                    this.completed = true;
                    resolve();
                };
                sourceImage.src = imageUrl;
            });
        }
        getRotatedImage(r) {
            let i = Math.floor(r / (Math.PI * 2 / resolution)) % resolution;
            if (i < 0)
                i += resolution;
            return this.rotatedImages[i];
        }
        async loadSEAsync() {
            const res = await fetch('/api/assets/coinsoundbase64/' + this.coinType);
            const base64str = await res.text();
            const seUrl = 'data:audio/mp3;base64,' + base64str;
            return seUrl;
        }
    }
    NaaS.CoinAsset = CoinAsset;
})(NaaS || (NaaS = {}));
