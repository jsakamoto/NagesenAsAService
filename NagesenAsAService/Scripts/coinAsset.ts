namespace NaaS {
    export class CoinAsset {
        public image!: HTMLImageElement;

        //public fixtureDef: b2.FixtureDef = null;

        constructor(
            public coinType: CoinType,
            public imageUrl: string,
            public radius: number,
            public seUrl: string | null
        ) {
            this.init();
        }

        private async init(): Promise<void> {
            this.image = this.resizeImage(this.imageUrl, 2 * this.radius);
            await this.loadSEAsync();
        }

        // 参考：http://elicon.blog57.fc2.com/blog-entry-109.html
        private resizeImage(src: string, new_size: number): HTMLImageElement {
            var image_data = new Image();

            var img0 = new Image();
            img0.onload = () => {
                var canvas0 = document.createElement('canvas');

                var width = img0.naturalWidth;
                var height = img0.naturalHeight;
                var chouhen = (width >= height) ? width : height;
                var canvaswidth = width;
                var canvasheight = height;
                if (chouhen >= new_size) {
                    canvaswidth = new_size / chouhen * width;
                    canvasheight = new_size / chouhen * height;
                }
                canvas0.width = canvaswidth;
                canvas0.height = canvasheight;

                var context = canvas0.getContext("2d")!;
                context.drawImage(img0, 0, 0, canvaswidth, canvasheight);
                image_data.src = canvas0.toDataURL("image/png");
            }
            img0.src = src;

            return image_data;
        }

        private async loadSEAsync(): Promise<void> {
            const res = await fetch('/api/assets/coinsoundbase64/' + this.coinType);
            const base64str = await res.text();
            this.seUrl = 'data:audio/mp3;base64,' + base64str;
        }
    }
}