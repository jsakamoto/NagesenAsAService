﻿/// <reference types="@types/box2d" />

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

namespace NaaS {

    interface CoinState {
        sessionId: string,
        coins: {
            x: number;
            y: number;
            a: number;
            t: CoinType;
        }[];
    }

    class NagesenBoxController {

        private get roomContext(): RoomContext { return this.roomContextService.roomContext; }

        private countOfLikeElement!: HTMLElement;
        private countOfDisElement!: HTMLElement;
        private boxElement!: HTMLElement;
        private titleElement!: HTMLElement;

        private coinAssets: CoinAsset[] = [
            new CoinAsset(CoinType.Like, '/images/like-coin.png', 20, null),
            new CoinAsset(CoinType.Dis, '/images/dis-coin.png', 15, null)
        ];

        private worker!: Worker;

        private context!: CanvasRenderingContext2D;
        private world!: Box2D.Dynamics.b2World;

        private worldWidth: number = 0;
        private worldHeight: number = 0;
        /** World座標の高さのうち、Canvas に描画されない、ボックス上部の投入域の高さ */
        private throwingBandHeight = 120;
        private worldScale = 30.0;
        private frameRate = 60;
        /** ボックスがコインで満杯になったかどうかの、render()メソッドでの判定結果を保持します。
            (動かなくなったコインで、中心座標が投入域の1/2.5の高さにまで達したものがあれば、満杯であると判定します) */
        private boxIsFull: boolean = false;

        constructor(
            private roomContextService: RoomContextService,
            private urlService: UrlService,
            private hubConn: HubConnectionService,
            private tweeter: TweetService
        ) {
            this.init();
            this.update();
        }

        async init(): Promise<void> {

            this.countOfLikeElement = document.getElementById('count-of-like')!;
            this.countOfDisElement = document.getElementById('count-of-dis')!;
            this.boxElement = document.getElementById('box')!;
            this.titleElement = document.getElementById('session-title')!;

            const tweetScoreButton = document.getElementById('tweet-score-button');
            if (tweetScoreButton !== null) tweetScoreButton.addEventListener('click', e => this.onClickTweetScoreButton());

            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));

            await this.roomContextService.roomEntered;

            this.hubConn.onThrow(args => this.onThrowCoin(args));
            this.hubConn.onResetedScore(_ => this.initWorld());
            this.roomContextService.subscribeChanges(() => this.update());

            const canvas = document.getElementById('canvas') as HTMLCanvasElement;
            this.context = canvas.getContext('2d')!;
            this.worldWidth = canvas.width;
            this.worldHeight = canvas.height + this.throwingBandHeight;

            this.initWorld();
            this.restoreCoinsState();

            this.worker = new Worker('/scripts/nagesenBox.worker.js');
            this.worker.addEventListener('message', e => this.onWorkerMessage(e));

            this.update();
        }

        private update(): void {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;
        }

        private onClickTweetScoreButton(): void {
            this.tweeter.tweetScore(TweetType.FromBox, this.roomContext);
        }

        private onBeforeUnload(e: BeforeUnloadEvent): string {
            e.preventDefault();
            return e.returnValue = NaaS.localize.IfYouLeaveThisPageYouLostCoinsImage;
        }

        private onThrowCoin(args: ThrowCoinEventArgs): void {
            console.log('onThrowCoin', args);
            this.worker.postMessage({ cmd: 'Enqueue', args });
        }

        private onWorkerMessage(e: MessageEvent): void {
            switch (e.data.cmd) {
                case 'Interval':
                    this.stepWorld();
                    break;
                case 'Enqueue':
                    this.onEnqueueThrowing(e.data.args);
                    break;
            }
        }

        private onEnqueueThrowing(args: ThrowCoinEventArgs) {

            const coinAsset = this.coinAssets[args.typeOfCoin];
            if (coinAsset.seUrl != null) (new Audio(coinAsset.seUrl)).play();

            this.roomContext.countOfLike = Math.max(this.roomContext.countOfLike, args.countOfLike);
            this.roomContext.countOfDis = Math.max(this.roomContext.countOfDis, args.countOfDis);
            this.update();

            // ボックスが満杯と判定されていたら、効果音の再生とコイン数の表示更新だけとして、コイン投入のアニメーションはスキップする。
            if (this.boxIsFull) {

                //        // ※ただしコイン数表示の更新は発生するので、スクリーンショットの再取得を行う
                //        if (this.debounceTakingScreenShotId != null) clearTimeout(this.debounceTakingScreenShotId);
                //        this.debounceTakingScreenShotId = setTimeout(() => {
                //            this.debounceTakingScreenShotId = null;
                //            this.takeScreenShot();
                //        }, 5000);

                return;
            }

            const radius = coinAsset.radius;
            this.createCoin({
                x: radius + (0 | ((this.worldWidth - 2 * radius) * args.throwPoint)),
                y: -radius,
                a: 0,
                t: coinAsset.coinType
            });

            this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
        }

        private initWorld(): void {
            this.boxIsFull = false;
            this.world = new b2.World(
                new b2.Vec2(0, 50), // 重力方向
                true                 // Sleepの可否
            );
            this.createFixedBox(0, 0, 2, this.worldHeight);
            this.createFixedBox(0, this.worldHeight - 2, this.worldWidth, 2);
            this.createFixedBox(this.worldWidth - 2, 0, 2, this.worldHeight);

            //this.world.SetDebugDraw(this.getDebugDraw());

            this.world.ClearForces();
            this.render();
        }

        private createFixedBox(x: number, y: number, width: number, height: number) {
            const bodyDef = new b2.BodyDef;
            bodyDef.type = b2.Body.b2_staticBody;

            // オブジェクトの設定
            const fixDef = new b2.FixtureDef;
            fixDef.density = 1.0;     // 密度
            fixDef.friction = 0.5;    // 摩擦係数
            fixDef.restitution = 0.4; // 反発係数

            // 床の設置
            const shape = new b2.PolygonShape();
            shape.SetAsBox(width / this.worldScale, height / this.worldScale);
            fixDef.shape = shape;
            bodyDef.position.Set(x / this.worldScale, y / this.worldScale);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);
        }

        private createCoin(coinState: { x: number, y: number, a: number, t: CoinType }) {

            const coinAsset = this.coinAssets[coinState.t];

            // オブジェクトの設定
            if (coinAsset.fixtureDef === null) {
                coinAsset.fixtureDef = new b2.FixtureDef;
                coinAsset.fixtureDef.density = 100.0;     // 密度
                coinAsset.fixtureDef.friction = 0.5;     // 摩擦係数
                coinAsset.fixtureDef.restitution = 0.7;  // 反発係数
                coinAsset.fixtureDef.shape = new b2.CircleShape(coinAsset.radius / this.worldScale);
            }

            // 円形オブジェクトの設置
            const bodyDef = new b2.BodyDef;
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

                const pos = bodyItem.GetPosition();
                const slideX = pos.x * this.worldScale;
                const slideY = (pos.y * this.worldScale) - this.throwingBandHeight;

                const isAwake = bodyItem.IsAwake();
                isAwakeAnyBody = isAwakeAnyBody || isAwake;

                // 投入域の1/2.5にまで溜まって安定したコインがあれば、ボックスは満杯と判定
                if (isAwake === false && slideY <= -(this.throwingBandHeight / 2.5)) {
                    boxIsFull = true;
                }

                // userData に設定したコイン画像が取得できない body は処理スキップ。
                const userData = bodyItem.GetUserData() as CoinAsset;
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

            const result = { isAwake: isAwakeAnyBody, boxIsFull };
            return result;
        }

        private stepWorld() {
            this.world.Step(1 / this.frameRate, 10, 10);
            //this.world.DrawDebugData();
            this.world.ClearForces();

            const result = this.render();
            this.boxIsFull = result.boxIsFull;

            if (result.isAwake === false) {
                this.worker.postMessage({ cmd: 'Stop' });
                this.saveCoinsState();
                //if (_app.isOwner) this.takeScreenShot();
            }
        }

        private saveCoinsState(): void {
            const coinsState: CoinState = {
                sessionId: this.roomContext.sessionID,
                coins: []
            };
            for (var bodyItem = this.world.GetBodyList(); bodyItem; bodyItem = bodyItem.GetNext()) {

                // Type が dynamicBody である body だけに絞り込み
                if (bodyItem.GetType() != b2.Body.b2_dynamicBody) continue;

                const coinAsset = bodyItem.GetUserData() as CoinAsset;
                if (coinAsset == null || coinAsset.coinType == null) continue;

                const pos = bodyItem.GetPosition();
                coinsState.coins.push({
                    x: pos.x * this.worldScale,
                    y: pos.y * this.worldScale,
                    a: bodyItem.GetAngle(),
                    t: coinAsset.coinType
                });
            }

            const coinsStateJson = JSON.stringify(coinsState);
            sessionStorage.setItem('coinsState', coinsStateJson);
        }

        private restoreCoinsState(): void {
            const coinsStateJson = sessionStorage.getItem('coinsState') || '';
            if (coinsStateJson == '') return;

            const coinsState = JSON.parse(coinsStateJson) as CoinState;
            if (coinsState.sessionId != this.roomContext.sessionID) {
                sessionStorage.removeItem('coinsState');
                return;
            }

            coinsState.coins.forEach(state => this.createCoin(state));

            const coinImages = this.coinAssets.map(asset => asset.image);
            new Promise<void>((resolve) => {
                const checkAllCoinImagesLoaded = () => { if (coinImages.every(img => img.complete)) resolve(); };
                coinImages.forEach(img => img.addEventListener('load', () => { checkAllCoinImagesLoaded(); }));
                checkAllCoinImagesLoaded();
            }).then(() => {
                this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
            });
        }
    }

    export const nagesenBoxController = new NagesenBoxController(
        roomContextService,
        urlService,
        hubConnService,
        tweetService);
}