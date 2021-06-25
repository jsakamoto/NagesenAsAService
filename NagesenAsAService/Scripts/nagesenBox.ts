/// <reference types="box2d" />
/// <reference types="html2canvas" />

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

/** コインの半径 */
const radiusOfCoin = 15;
/** 満杯と判断されるコインの総枚数 */
const maxNumberOfCoins = 580;
/** コイン 1枚あたりの単価 */
const unitPriceOfCoin = 10;

namespace NaaS {

    interface CoinState {
        sessionId: string,
        countOfLikeCoin?: number,
        countOfDisCoin?: number,
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
        private unitOfLikeElement!: HTMLElement;
        private countOfDisElement!: HTMLElement;
        private unitOfDisElement!: HTMLElement;
        private boxElement!: HTMLElement;
        private titleElement!: HTMLElement;

        private coinAssets: CoinAsset[] = [
            new CoinAsset(CoinType.Like, '/images/like-coin.png', radiusOfCoin),
            new CoinAsset(CoinType.Dis, '/images/dis-coin.png', radiusOfCoin)
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

        /** 投入可能な空き位置 */
        private throwingPoints: { index: number, used: boolean }[] = [];

        private currentCountOfLikeCoin: number = 0;
        private currentCountOfDisCoin: number = 0;

        /** ボックスがコインで満杯になったかどうかの判定結果 (以下のいずれか) を保持します。
            (a) render()メソッド内で、動かなくなったコインの内、中心座標が投入域の1/2.5の高さにまで達したものがあれば、満杯であると判定
            (b) レンダリングされるコイン枚数が 定数 maxNumberOfCoins 毎を超えたら、満杯であると判定
        */
        private boxIsFull: boolean = false;

        private sePlayers: { [key: number]: { audio: HTMLMediaElement[], i: number } } = {};

        constructor(
            private roomContextService: RoomContextService,
            private urlService: UrlService,
            private httpClient: HttpClientService,
            private hubConn: HubConnectionService,
            private tweeter: TweetService
        ) {
            this.init();
        }

        async init(): Promise<void> {

            this.countOfLikeElement = document.getElementById('count-of-like')!;
            this.unitOfLikeElement = document.getElementById('unit-of-like')!;
            this.countOfDisElement = document.getElementById('count-of-dis')!;
            this.unitOfDisElement = document.getElementById('unit-of-dis')!;
            this.boxElement = document.getElementById('box')!;
            this.titleElement = document.getElementById('session-title')!;

            const tweetScoreButton = document.getElementById('tweet-score-button');
            if (tweetScoreButton !== null) tweetScoreButton.addEventListener('click', e => this.onClickTweetScoreButton());


            for (const asset of this.coinAssets) {
                const seUrl = await asset.loadSEAsync();
                const sePlayerSet = { audio: Array(5).fill(0).map(_ => new Audio(seUrl)), i: 0 };
                this.sePlayers[asset.coinType] = sePlayerSet;
            }

            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));

            await this.roomContextService.roomEntered;

            this.hubConn.onThrow(args => this.onThrowCoin(args));
            this.hubConn.onResetedScore(_ => this.initWorld());
            this.roomContextService.subscribeChanges(() => {
                this.update();
                this.takeScreenShotDebounced(5000);
            });

            const canvas = document.getElementById('canvas') as HTMLCanvasElement;
            this.context = canvas.getContext('2d')!;
            this.worldWidth = canvas.width;
            this.worldHeight = canvas.height + this.throwingBandHeight;

            // ボックスの幅が決まったら、コインの直径で割って、投入位置配列を初期化する
            const numOfThrowingPoints = (0 | this.worldWidth / (radiusOfCoin * 2));
            this.throwingPoints = Array(numOfThrowingPoints).fill(0).map((_, i) => ({ index: i, used: false }));

            this.initWorld();
            this.restoreCoinsState();

            this.worker = new Worker('/scripts/nagesenBox.worker.min.js');
            this.worker.addEventListener('message', e => this.onWorkerMessage(e));

            this.update();

            if (this.roomContext.countOfLike === 0 && this.roomContext.countOfDis === 0) {
                this.takeScreenShotDebounced(1000);
            }
        }

        private update(): void {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.unitOfLikeElement.textContent = this.roomContext.unitOfLikeCoin;
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.unitOfDisElement.textContent = this.roomContext.unitOfDisCoin;
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

            // 表示金額を更新
            this.roomContext.countOfLike = Math.max(this.roomContext.countOfLike, args.countOfLike);
            this.roomContext.countOfDis = Math.max(this.roomContext.countOfDis, args.countOfDis);
            this.update();

            const deltaOfLike = this.roomContext.countOfLike - this.currentCountOfLikeCoin;
            const deltaOfDis = this.roomContext.countOfDis - this.currentCountOfDisCoin;
            const deltaSet = [
                { typeOfCoin: CoinType.Like, delta: deltaOfLike, increment: (n: number) => { this.currentCountOfLikeCoin += n; } },
                { typeOfCoin: CoinType.Dis, delta: deltaOfDis, increment: (n: number) => { this.currentCountOfDisCoin += n; } }];

            //console.log('start', { Like: this.currentCountOfLikeCoin, Dis: this.currentCountOfDisCoin });
            //console.log('delta', { Like: deltaOfLike, Dis: deltaOfDis });

            for (var delta of deltaSet) {
                const typeOfCoin = delta.typeOfCoin;

                for (var i = 0; i < delta.delta; i += unitPriceOfCoin) {

                    this.playSE(typeOfCoin);

                    delta.increment(unitPriceOfCoin);

                    if ((this.currentCountOfLikeCoin + this.currentCountOfDisCoin) / unitPriceOfCoin > maxNumberOfCoins) {
                        this.boxIsFull = true;
                        //console.log('BOX-IS-FULL!')
                    }

                    // ボックスが満杯の場合は、音を鳴らすだけで、実コインの作成は行なわない
                    if (this.boxIsFull) {
                        this.takeScreenShotDebounced(5000);
                        continue;
                    }

                    // 直近で未投下の空き位置を収集
                    let availablePoints = this.throwingPoints.filter(p => !p.used);
                    if (availablePoints.length == 0) {
                        for (var p of this.throwingPoints) { p.used = false; }
                        availablePoints = this.throwingPoints;
                    }

                    // 空き位置のうちいずれかを乱数で選択することで、コインの投下位置 (X座標) を決定
                    const px = Math.floor(Math.random() * availablePoints.length);
                    const throwingPoint = availablePoints[px];
                    throwingPoint.used = true;
                    const x = radiusOfCoin + (radiusOfCoin * 2) * throwingPoint.index;

                    // 投下位置にコインを新規作成
                    this.createCoin({ x: x, y: -radiusOfCoin, a: 0, t: typeOfCoin });
                }
            }
            // console.log('thrown', { Like: this.currentCountOfLikeCoin, Dis: this.currentCountOfDisCoin });

            this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
        }

        private initWorld(): void {
            this.currentCountOfLikeCoin = 0;
            this.currentCountOfDisCoin = 0;

            this.boxIsFull = false;
            this.world = new b2.World(
                new b2.Vec2(0, 50), // 重力方向
                true                 // Sleepの可否
            );
            this.createFixedBox(0, 0, 2, this.worldHeight);
            this.createFixedBox(0, this.worldHeight - 2, this.worldWidth, 2);
            this.createFixedBox(this.worldWidth - 2, 0, 2, this.worldHeight);

            // this.world.SetDebugDraw(this.getDebugDraw()); // DEBUG:

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
                if (userData === null || userData.completed === false) continue;

                // 描画域に降りてきてない body は処理スキップ。
                if (slideY < -userData.radius) continue;

                // 以上の諸条件をクリアした body を canvas に描画。
                const image = userData.getRotatedImage(bodyItem.GetAngle());
                this.context.drawImage(image, slideX - userData.radius, slideY - userData.radius);
            }

            const result = { isAwake: isAwakeAnyBody, boxIsFull };
            return result;
        }

        private stepWorld() {
            this.world.Step(1 / this.frameRate, 10, 10);
            // this.world.DrawDebugData(); // DEBUG:
            this.world.ClearForces();

            const result = this.render();
            this.boxIsFull = result.boxIsFull;

            if (result.isAwake === false) {
                this.worker.postMessage({ cmd: 'Stop' });
                this.saveCoinsStateDebounced();
                this.takeScreenShotDebounced(2000);
            }
        }

        private saveCoinsStateDebounceTimerId: NodeJS.Timeout | number = -1;

        private saveCoinsStateDebounced(): void {

            if (this.saveCoinsStateDebounceTimerId !== -1) clearTimeout(this.saveCoinsStateDebounceTimerId as any);

            this.saveCoinsStateDebounceTimerId = setTimeout(() => {
                this.saveCoinsStateDebounceTimerId = -1;

                const coinsState: CoinState = {
                    sessionId: this.roomContext.sessionID,
                    countOfLikeCoin: this.currentCountOfLikeCoin,
                    countOfDisCoin: this.currentCountOfDisCoin,
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

            }, 5000);
        }

        private async restoreCoinsState(): Promise<void> {
            const coinsStateJson = sessionStorage.getItem('coinsState') || '';
            if (coinsStateJson == '') return;

            const coinsState = JSON.parse(coinsStateJson) as CoinState;
            if (coinsState.sessionId != this.roomContext.sessionID) {
                sessionStorage.removeItem('coinsState');
                return;
            }

            coinsState.coins.forEach(state => this.createCoin(state));
            this.currentCountOfLikeCoin = coinsState.countOfLikeCoin || (coinsState.coins.filter(c => c.t === CoinType.Like).length * unitPriceOfCoin);
            this.currentCountOfDisCoin = coinsState.countOfDisCoin || (coinsState.coins.filter(c => c.t === CoinType.Dis).length * unitPriceOfCoin);

            const coinAssetCompletions = this.coinAssets.map(asset => asset.completeAsync);
            for (const completion of coinAssetCompletions) {
                await completion;
            }
            this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
        }

        private screenShotDebounceTimerId: NodeJS.Timeout | number = -1;

        private takeScreenShotDebounced(delay: number): void {

            // オーナーである場合のみ
            if (this.roomContext.isOwnedByCurrentUser === false) return;

            if (this.screenShotDebounceTimerId !== -1) clearTimeout(this.screenShotDebounceTimerId as any);

            this.screenShotDebounceTimerId = setTimeout(() => { this.takeScreenShotCoreAsync(); }, delay);
        }

        private async takeScreenShotCoreAsync(): Promise<void> {
            this.screenShotDebounceTimerId = -1;
            const screenShotCanvas = await html2canvas(this.boxElement);
            const imageDataUrl = screenShotCanvas.toDataURL('image/jpeg', 0.6);
            const apiUrl = this.urlService.apiBaseUrl + '/screenshot'
            await this.httpClient.postAsync(apiUrl, { imageDataUrl });
        }

        private playSE(typeOfCoin: CoinType): void {
            const sePlayer = this.sePlayers[typeOfCoin];
            const audio = sePlayer.audio[sePlayer.i];
            audio.pause();
            audio.currentTime = 0;
            audio.play();
            sePlayer.i = (sePlayer.i + 1) % sePlayer.audio.length;
        }
    }

    export const nagesenBoxController = new NagesenBoxController(
        roomContextService,
        urlService,
        httpClientService,
        hubConnService,
        tweetService);
}