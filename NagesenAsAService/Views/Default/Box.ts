namespace b2 {
    export import Vec2 = Box2D.Common.Math.b2Vec2;
    export import BodyDef = Box2D.Dynamics.b2BodyDef;
    export import Body = Box2D.Dynamics.b2Body;
    export import FixtureDef = Box2D.Dynamics.b2FixtureDef;
    export import Fixture = Box2D.Dynamics.b2Fixture;
    export import World = Box2D.Dynamics.b2World;
    export import PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    export import CircleShape = Box2D.Collision.Shapes.b2CircleShape;
    export import DebugDraw = Box2D.Dynamics.b2DebugDraw;
}

declare function html2canvas(element: HTMLElement, options?: {
    onrendered?: (canvas: HTMLCanvasElement) => void;
    height?: number;
    width?: number;
}): void;

namespace NaaS {

    var theApp = angular.module('theApp', []);

    namespace Box {
        class CoinAsset {
            public image: HTMLImageElement;

            constructor(
                public imageUrl: string,
                public imageRadius: number,
                public seUrl: string
            ) {
                this.image = this.resizeImage(imageUrl, 2 * imageRadius);
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

                    var context = canvas0.getContext("2d");
                    context.drawImage(img0, 0, 0, canvaswidth, canvasheight);
                    image_data.src = canvas0.toDataURL("image/png");
                }
                img0.src = src;

                return image_data;
            }
        }

        var CoinAssets = new Array<CoinAsset>();
        CoinAssets[CoinType.Like] = new CoinAsset('/Content/images/coin.png', 20, null);
        CoinAssets[CoinType.Dis] = new CoinAsset('/Content/images/stone.png', 15, null);

        interface ThrowingData {
            throwPoint: number;
            typeOfCoin: CoinType;
            countOfLike: number;
            countOfDis: number;
        }

        export class RoomController {
            context: CanvasRenderingContext2D;
            world: Box2D.Dynamics.b2World;

            private worldWidth: number;
            private worldHeight: number;
            /** World座標の高さのうち、Canvas に描画されない、ボックス上部の投入域の高さ */
            private throwingBandHeight = 120;
            private worldScale = 30.0;
            private frameRate = 60;
            private worker: Worker;
            /** ボックスがコインで満杯になったかどうかの、render()メソッドでの判定結果を保持します。
                (動かなくなったコインで、中心座標が投入域の1/2.5の高さにまで達したものがあれば、満杯であると判定します) */
            private boxIsFull: boolean;

            constructor(
                public roomContext: RoomContextService,
                private hubClient: HubClientService,
                private $scope: ng.IScope,
                private $http: ng.IHttpService
            ) {
                var canvas = document.getElementById('canvas') as HTMLCanvasElement;
                this.context = canvas.getContext('2d');
                this.worldWidth = canvas.width;
                this.worldHeight = canvas.height + this.throwingBandHeight;

                this.hubClient.hub.on('Throw', this.OnThrow.bind(this));

                $scope.$watch(() => roomContext.sessionID, (newVal, oldVal) => {
                    if (newVal != '' && oldVal != '') this.initWorld();
                });

                this.initWorld();
                this.worker = new Worker('/Views/Default/BoxWorker.js');
                this.worker.addEventListener('message', this.OnWorkerMessage.bind(this));

                this.loadSoundAsset(CoinType.Like);
                this.loadSoundAsset(CoinType.Dis);
            }

            private loadSoundAsset(coinType: number): void {
                $.ajax({
                    url: '/CoinSoundBase64/' + coinType
                }).then(base64str => {
                    CoinAssets[coinType].seUrl = 'data:audio/mp3;base64,' + base64str;
                });
            }

            private OnThrow(data: ThrowingData): void {
                this.worker.postMessage({ cmd: 'Enqueue', data });
            }

            private OnWorkerMessage(e: MessageEvent): void {
                switch (e.data.cmd) {
                    case 'Interval':
                        this.stepWorld();
                        break;
                    case 'Enqueue':
                        this.OnEnqueueThrowing(e.data.data);
                        break;
                }
            }

            private debounceTakingScreenShotId: number = null;

            private OnEnqueueThrowing(data: ThrowingData) {

                let coinAsset = CoinAssets[data.typeOfCoin];
                if (coinAsset.seUrl != null) (new Audio(coinAsset.seUrl)).play();
                this.$scope.$apply(() => {
                    this.roomContext.countOfLike = Math.max(this.roomContext.countOfLike, data.countOfLike);
                    this.roomContext.countOfDis = Math.max(this.roomContext.countOfDis, data.countOfDis);
                });

                // ボックスが満杯と判定されていたら、効果音の再生とコイン数の表示更新だけとして、コイン投入のアニメーションはスキップする。
                if (this.boxIsFull) {

                    // ※ただしコイン数表示の更新は発生するので、スクリーンショットの再取得を行う
                    if (this.debounceTakingScreenShotId != null) clearTimeout(this.debounceTakingScreenShotId);
                    this.debounceTakingScreenShotId = setTimeout(() => {
                        this.debounceTakingScreenShotId = null;
                        this.takeScreenShot();
                    }, 5000);

                    return;
                }

                let circleRadius = coinAsset.imageRadius;
                this.createCircle({
                    world: this.world,
                    x: circleRadius + (0 | ((this.worldWidth - 2 * circleRadius) * data.throwPoint)),
                    y: -circleRadius,
                    r: circleRadius,
                    img: coinAsset.image
                });

                this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
            }

            private getDebugDraw() {
                var debugDraw = new b2.DebugDraw();
                debugDraw.SetSprite(this.context);
                debugDraw.SetDrawScale(this.worldScale);
                debugDraw.SetFillAlpha(0.5);
                debugDraw.SetLineThickness(1.0);
                debugDraw.SetFlags(b2.DebugDraw.e_shapeBit);
                return debugDraw;
            }

            private initWorld() {
                this.boxIsFull = false;
                this.world = new b2.World(
                    new b2.Vec2(0, 50), // 重力方向
                    true                 // Sleepの可否
                );
                this.createFixedBox(0, 0, 2, this.worldHeight);
                this.createFixedBox(0, this.worldHeight - 2, this.worldWidth, 2);
                this.createFixedBox(this.worldWidth - 2, 0, 2, this.worldHeight);

                this.world.SetDebugDraw(this.getDebugDraw());

                this.world.ClearForces();
                this.render();
            }

            private stepWorld() {
                this.world.Step(1 / this.frameRate, 10, 10);
                //this.world.DrawDebugData();
                this.world.ClearForces();

                let result = this.render();
                this.boxIsFull = result.boxIsFull;

                if (result.isAwake == false) {
                    this.worker.postMessage({ cmd: 'Stop' });
                    if (_app.isOwner) this.takeScreenShot();
                }
            }

            private takeScreenShot(): void {
                html2canvas(document.getElementById('box'), {
                    onrendered: canvas => {
                        this.$http.post(_app.apiBaseUrl + '/ScreenShot', { imageDataUrl: canvas.toDataURL('image/jpeg', 0.6) });
                    }
                });
            }

            private createFixedBox(x: number, y: number, width: number, height: number) {
                var bodyDef = new b2.BodyDef;
                bodyDef.type = b2.Body.b2_staticBody;

                // オブジェクトの設定
                var fixDef = new b2.FixtureDef;
                fixDef.density = 1.0;     // 密度
                fixDef.friction = 0.5;    // 摩擦係数
                fixDef.restitution = 0.4; // 反発係数

                // 床の設置
                fixDef.shape = new b2.PolygonShape;
                var shape: any = fixDef.shape;
                shape.SetAsBox(width / this.worldScale, height / this.worldScale);
                bodyDef.position.Set(x / this.worldScale, y / this.worldScale);
                this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            private createCircle(option: { world: Box2D.Dynamics.b2World, x: number, y: number, r: number, img: HTMLImageElement }) {

                // オブジェクトの設定
                let fixDef = new b2.FixtureDef;
                fixDef.density = 100.0;     // 密度
                fixDef.friction = 0.5;     // 摩擦係数
                fixDef.restitution = 0.7;  // 反発係数
                fixDef.shape = new b2.CircleShape(option.r / this.worldScale);

                // 円形オブジェクトの設置
                let bodyDef = new b2.BodyDef;
                bodyDef.type = b2.Body.b2_dynamicBody;
                bodyDef.position.x = option.x / this.worldScale;
                bodyDef.position.y = option.y / this.worldScale;
                bodyDef.linearDamping = 0.5; // 減衰率
                bodyDef.userData = { img: option.img, r: option.r };

                option.world.CreateBody(bodyDef).CreateFixture(fixDef);
            }

            private render(): { isAwake: boolean, boxIsFull: boolean } {
                this.context.clearRect(0, 0, this.worldWidth, this.worldHeight);
                let boxIsFull = false;
                let isAwakeAnyBody = false;
                for (var bodyItem = this.world.GetBodyList(); bodyItem; bodyItem = bodyItem.GetNext()) {

                    // Type が dynamicBody である body だけに絞り込み
                    if (bodyItem.GetType() != b2.Body.b2_dynamicBody) continue;

                    let pos = bodyItem.GetPosition();
                    let slideX = pos.x * this.worldScale;
                    let slideY = (pos.y * this.worldScale) - this.throwingBandHeight;

                    let isAwake = bodyItem.IsAwake();
                    isAwakeAnyBody = isAwakeAnyBody || isAwake;

                    // 投入域の1/2.5にまで溜まって安定したコインがあれば、ボックスは満杯と判定
                    if (isAwake == false && slideY <= -(this.throwingBandHeight / 2.5)) {
                        boxIsFull = true;
                    }

                    // userData に設定したコイン画像が取得できない body は処理スキップ。
                    var userData = bodyItem.GetUserData() as { img: HTMLImageElement, r: number };
                    if (userData == null || userData.img == null || userData.img.complete == false) continue;

                    // 描画域に降りてきてない body は処理スキップ。
                    if (slideY < -userData.r) continue;

                    // 以上の諸条件をクリアした body を canvas に描画。
                    this.context.save();
                    this.context.translate(slideX, slideY);
                    this.context.rotate(bodyItem.GetAngle());
                    this.context.drawImage(userData.img, -userData.r, -userData.r);
                    this.context.restore();
                }

                let result = { isAwake: isAwakeAnyBody, boxIsFull };
                return result;
            }

            public tweet(): void {
                var text =
                    `この枠に${this.roomContext.countOfLike}円分の投げ銭` +
                    (this.roomContext.allowDisCoin ? `と${this.roomContext.countOfDis}Dis` : '') +
                    `が集まりました☆`;
                var url = _app.apiBaseUrl + '/TwitterShare?';
                url += 'text=' + encodeURIComponent(text);
                url += '&url=' + encodeURIComponent(_app.apiBaseUrl + '/screenshot/' + this.roomContext.sessionID);
                window.open(url);
            }
        }

        theApp.controller('roomController', ['roomContext', 'hubClient', '$scope', '$http', RoomController]);

        $(() => {
            $('#lnk-tweet').click(function (e) {
                e.preventDefault();
                var roomController = <RoomController>angular.element(document.getElementById('box')).controller();
                roomController.tweet();
            });

            $(window).on('beforeunload', e => _app.localize.IfYouLeaveThisPageYouLostCoinsImage);
        });
    }
}