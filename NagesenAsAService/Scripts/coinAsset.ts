namespace NaaS {

    const resolution: number = 100;

    export class CoinAsset {

        public fixtureDef: b2.FixtureDef | null = null;

        private rotatedImages: HTMLImageElement[] = [];

        public completeAsync: Promise<void>;

        public completed: boolean = false;

        constructor(
            public coinType: CoinType,
            imageUrl: string,
            public radius: number,
        ) {
            this.rotatedImages = Array(resolution).fill(0).map(_ => new Image());

            this.completeAsync = new Promise<void>(resolve => {
                const sourceImage = new Image();
                sourceImage.onload = () => {

                    // 参考：http://elicon.blog57.fc2.com/blog-entry-109.html
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

                    var context = canvas0.getContext("2d")!;
                    for (var i = 0; i < this.rotatedImages.length; i++) {
                        context.clearRect(0, 0, canvaswidth, canvasheight);
                        context.save();
                        context.translate(this.radius, this.radius);
                        context.rotate(Math.PI * 2 / resolution * i);
                        context.drawImage(sourceImage, -this.radius, -this.radius, canvaswidth, canvasheight);
                        context.restore();

                        this.rotatedImages[i].src = canvas0.toDataURL("image/png");
                    }

                    this.completed = true;
                    resolve();
                }
                sourceImage.src = imageUrl;
            });
        }

        public getRotatedImage(r: number): HTMLImageElement {
            let i = Math.floor(r / (Math.PI * 2 / resolution)) % resolution;
            if (i < 0) i += resolution;
            return this.rotatedImages[i];
        }

        public async loadSEAsync(): Promise<string> {
            const res = await fetch('/api/assets/coinsoundbase64/' + this.coinType);
            const base64str = await res.text();
            const seUrl = 'data:audio/mp3;base64,' + base64str;
            return seUrl;
        }
    }
}