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

            public fixtureDef: b2.FixtureDef = null;

            constructor(
                public imageUrl: string,
                public radius: number,
                public seUrl: string,
                public coinType: CoinType
            ) {
                this.image = this.resizeImage(imageUrl, 2 * radius);
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
        CoinAssets[CoinType.Like] = new CoinAsset('/Content/images/coin.png', 20, null, CoinType.Like);
        CoinAssets[CoinType.Dis] = new CoinAsset('/Content/images/stone.png', 15, null, CoinType.Dis);

        interface ThrowingData {
            throwPoint: number;
            typeOfCoin: CoinType;
            countOfLike: number;
            countOfDis: number;
        }

        interface ICoinState {
            sessionId: string,
            coins: {
                x: number;
                y: number;
                a: number;
                t: CoinType;
            }[];
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
                private $http: ng.IHttpService,
                private tweeter: TweetService,
                $q: ng.IQService
            ) {
                var canvas = document.getElementById('canvas') as HTMLCanvasElement;
                this.context = canvas.getContext('2d');
                this.worldWidth = canvas.width;
                this.worldHeight = canvas.height + this.throwingBandHeight;

                this.hubClient.hub.on('Throw', this.OnThrow.bind(this));

                $scope.$watch(() => roomContext.sessionID, (newVal, oldVal) => {
                    if (newVal != '' && oldVal != '') this.initWorld();
                    if (newVal != '' && oldVal == '') this.restoreCoinsState($q);
                });

                this.initWorld();

                this.worker = new Worker('/Views/Default/BoxWorker.js');
                this.worker.addEventListener('message', this.OnWorkerMessage.bind(this));

                this.loadSoundAsset(CoinType.Like);
                this.loadSoundAsset(CoinType.Dis);

                $scope.$watch(() => roomContext.title, (newVal, oldVal) => {
                    setTimeout(() => this.takeScreenShot(), 1000);
                });
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

                let radius = coinAsset.radius;
                this.createCoin({
                    x: radius + (0 | ((this.worldWidth - 2 * radius) * data.throwPoint)),
                    y: -radius,
                    a: 0,
                    t: coinAsset.coinType
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
                    this.saveCoinsState();
                    if (_app.isOwner) this.takeScreenShot();
                }
            }

            private saveCoinsState(): void {
                let coinsState: ICoinState = {
                    sessionId: this.roomContext.sessionID,
                    coins: []
                };
                for (var bodyItem = this.world.GetBodyList(); bodyItem; bodyItem = bodyItem.GetNext()) {

                    // Type が dynamicBody である body だけに絞り込み
                    if (bodyItem.GetType() != b2.Body.b2_dynamicBody) continue;

                    let coinAsset = bodyItem.GetUserData() as CoinAsset;
                    if (coinAsset == null || coinAsset.coinType == null) continue;

                    let pos = bodyItem.GetPosition();
                    coinsState.coins.push({
                        x: pos.x * this.worldScale,
                        y: pos.y * this.worldScale,
                        a: bodyItem.GetAngle(),
                        t: coinAsset.coinType
                    });
                }

                let coinsStateJson = JSON.stringify(coinsState);
                sessionStorage.setItem('coinsState', coinsStateJson);
            }

            private restoreCoinsState($q: ng.IQService): void {

                let coinsStateJson = sessionStorage.getItem('coinsState') || '';
                if (coinsStateJson == '') return;

                let coinsState = JSON.parse(coinsStateJson) as ICoinState;
                if (coinsState.sessionId != this.roomContext.sessionID) {
                    sessionStorage.removeItem('coinsState');
                    return;
                }

                coinsState.coins.forEach(state => this.createCoin(state));

                let coinImages = CoinAssets.map(asset => asset.image);
                $q((resolve, reject) => {
                    let resolver = () => { if (coinImages.every(img => img.complete)) resolve(); };
                    coinImages.forEach(img => img.addEventListener('load', () => { resolver(); }));
                    resolver();
                }).then(() => {
                    this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
                });
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

            private createCoin(coinState: { x: number, y: number, a: number, t: CoinType }) {

                let coinAsset = CoinAssets[coinState.t];

                // オブジェクトの設定
                if (coinAsset.fixtureDef == null) {
                    coinAsset.fixtureDef = new b2.FixtureDef;
                    coinAsset.fixtureDef.density = 100.0;     // 密度
                    coinAsset.fixtureDef.friction = 0.5;     // 摩擦係数
                    coinAsset.fixtureDef.restitution = 0.7;  // 反発係数
                    coinAsset.fixtureDef.shape = new b2.CircleShape(coinAsset.radius / this.worldScale);
                }

                // 円形オブジェクトの設置
                let bodyDef = new b2.BodyDef;
                bodyDef.type = b2.Body.b2_dynamicBody;
                bodyDef.position.x = coinState.x / this.worldScale;
                bodyDef.position.y = coinState.y / this.worldScale;
                bodyDef.angle = coinState.a;
                bodyDef.linearDamping = 0.5; // 減衰率
                bodyDef.userData = coinAsset;

                this.world.CreateBody(bodyDef).CreateFixture(coinAsset.fixtureDef);
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
                    var userData = bodyItem.GetUserData() as CoinAsset;
                    if (userData == null || userData.image == null || userData.image.complete == false) continue;

                    // 描画域に降りてきてない body は処理スキップ。
                    if (slideY < -userData.radius) continue;

                    // 以上の諸条件をクリアした body を canvas に描画。
                    this.context.save();
                    this.context.translate(slideX, slideY);
                    this.context.rotate(bodyItem.GetAngle());
                    this.context.drawImage(userData.image, -userData.radius, -userData.radius);
                    this.context.restore();
                }

                let result = { isAwake: isAwakeAnyBody, boxIsFull };
                return result;
            }

            public tweet(): void {
                this.tweeter.openTweet(TweetType.FromBox, this.roomContext, _app.apiBaseUrl);
            }
        }

        theApp.controller('roomController', ['roomContext', 'hubClient', '$scope', '$http', 'tweeter', '$q', RoomController]);

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