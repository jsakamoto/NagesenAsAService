"use strict";
var b2;
(function (b2) {
    b2.Vec2 = Box2D.Common.Math.b2Vec2;
    b2.BodyDef = Box2D.Dynamics.b2BodyDef;
    b2.Body = Box2D.Dynamics.b2Body;
    b2.FixtureDef = Box2D.Dynamics.b2FixtureDef;
    b2.Fixture = Box2D.Dynamics.b2Fixture;
    b2.World = Box2D.Dynamics.b2World;
    b2.PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    b2.CircleShape = Box2D.Collision.Shapes.b2CircleShape;
    b2.DebugDraw = Box2D.Dynamics.b2DebugDraw;
})(b2 || (b2 = {}));
var NaaS;
(function (NaaS) {
    class NagesenBoxController {
        constructor(roomContextService, urlService, hubConn, tweeter) {
            this.roomContextService = roomContextService;
            this.urlService = urlService;
            this.hubConn = hubConn;
            this.tweeter = tweeter;
            this.coinAssets = [
                new NaaS.CoinAsset(0, '/images/like-coin.png', 20, null),
                new NaaS.CoinAsset(1, '/images/dis-coin.png', 15, null)
            ];
            this.worldWidth = 0;
            this.worldHeight = 0;
            this.throwingBandHeight = 120;
            this.worldScale = 30.0;
            this.frameRate = 60;
            this.boxIsFull = false;
            this.init();
            this.update();
        }
        get roomContext() { return this.roomContextService.roomContext; }
        async init() {
            this.countOfLikeElement = document.getElementById('count-of-like');
            this.countOfDisElement = document.getElementById('count-of-dis');
            this.boxElement = document.getElementById('box');
            this.titleElement = document.getElementById('session-title');
            const tweetScoreButton = document.getElementById('tweet-score-button');
            if (tweetScoreButton !== null)
                tweetScoreButton.addEventListener('click', e => this.onClickTweetScoreButton());
            window.addEventListener('beforeunload', e => this.onBeforeUnload(e));
            await this.roomContextService.roomEntered;
            this.hubConn.onThrow(args => this.onThrowCoin(args));
            this.hubConn.onResetedScore(_ => this.initWorld());
            this.roomContextService.subscribeChanges(() => this.update());
            const canvas = document.getElementById('canvas');
            this.context = canvas.getContext('2d');
            this.worldWidth = canvas.width;
            this.worldHeight = canvas.height + this.throwingBandHeight;
            this.initWorld();
            this.restoreCoinsState();
            this.worker = new Worker('/scripts/nagesenBox.worker.js');
            this.worker.addEventListener('message', e => this.onWorkerMessage(e));
            this.update();
        }
        update() {
            this.countOfLikeElement.textContent = this.roomContext.countOfLike.toLocaleString();
            this.countOfDisElement.textContent = this.roomContext.countOfDis.toLocaleString();
            this.boxElement.classList.toggle('has-title', this.roomContext.title !== '');
            this.boxElement.classList.toggle('allow-dis-coin', this.roomContext.allowDisCoin);
            this.titleElement.textContent = this.roomContext.title;
        }
        onClickTweetScoreButton() {
            this.tweeter.tweetScore(0, this.roomContext);
        }
        onBeforeUnload(e) {
            e.preventDefault();
            return e.returnValue = NaaS.localize.IfYouLeaveThisPageYouLostCoinsImage;
        }
        onThrowCoin(args) {
            console.log('onThrowCoin', args);
            this.worker.postMessage({ cmd: 'Enqueue', args });
        }
        onWorkerMessage(e) {
            switch (e.data.cmd) {
                case 'Interval':
                    this.stepWorld();
                    break;
                case 'Enqueue':
                    this.onEnqueueThrowing(e.data.args);
                    break;
            }
        }
        onEnqueueThrowing(args) {
            const coinAsset = this.coinAssets[args.typeOfCoin];
            if (coinAsset.seUrl != null)
                (new Audio(coinAsset.seUrl)).play();
            this.roomContext.countOfLike = Math.max(this.roomContext.countOfLike, args.countOfLike);
            this.roomContext.countOfDis = Math.max(this.roomContext.countOfDis, args.countOfDis);
            this.update();
            if (this.boxIsFull) {
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
        initWorld() {
            this.boxIsFull = false;
            this.world = new b2.World(new b2.Vec2(0, 50), true);
            this.createFixedBox(0, 0, 2, this.worldHeight);
            this.createFixedBox(0, this.worldHeight - 2, this.worldWidth, 2);
            this.createFixedBox(this.worldWidth - 2, 0, 2, this.worldHeight);
            this.world.ClearForces();
            this.render();
        }
        createFixedBox(x, y, width, height) {
            const bodyDef = new b2.BodyDef;
            bodyDef.type = b2.Body.b2_staticBody;
            const fixDef = new b2.FixtureDef;
            fixDef.density = 1.0;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.4;
            const shape = new b2.PolygonShape();
            shape.SetAsBox(width / this.worldScale, height / this.worldScale);
            fixDef.shape = shape;
            bodyDef.position.Set(x / this.worldScale, y / this.worldScale);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);
        }
        createCoin(coinState) {
            const coinAsset = this.coinAssets[coinState.t];
            if (coinAsset.fixtureDef === null) {
                coinAsset.fixtureDef = new b2.FixtureDef;
                coinAsset.fixtureDef.density = 100.0;
                coinAsset.fixtureDef.friction = 0.5;
                coinAsset.fixtureDef.restitution = 0.7;
                coinAsset.fixtureDef.shape = new b2.CircleShape(coinAsset.radius / this.worldScale);
            }
            const bodyDef = new b2.BodyDef;
            bodyDef.type = b2.Body.b2_dynamicBody;
            bodyDef.position.x = coinState.x / this.worldScale;
            bodyDef.position.y = coinState.y / this.worldScale;
            bodyDef.angle = coinState.a;
            bodyDef.linearDamping = 0.5;
            bodyDef.userData = coinAsset;
            this.world.CreateBody(bodyDef).CreateFixture(coinAsset.fixtureDef);
        }
        render() {
            this.context.clearRect(0, 0, this.worldWidth, this.worldHeight);
            let boxIsFull = false;
            let isAwakeAnyBody = false;
            for (var bodyItem = this.world.GetBodyList(); bodyItem; bodyItem = bodyItem.GetNext()) {
                if (bodyItem.GetType() != b2.Body.b2_dynamicBody)
                    continue;
                const pos = bodyItem.GetPosition();
                const slideX = pos.x * this.worldScale;
                const slideY = (pos.y * this.worldScale) - this.throwingBandHeight;
                const isAwake = bodyItem.IsAwake();
                isAwakeAnyBody = isAwakeAnyBody || isAwake;
                if (isAwake === false && slideY <= -(this.throwingBandHeight / 2.5)) {
                    boxIsFull = true;
                }
                const userData = bodyItem.GetUserData();
                if (userData == null || userData.image == null || userData.image.complete == false)
                    continue;
                if (slideY < -userData.radius)
                    continue;
                this.context.save();
                this.context.translate(slideX, slideY);
                this.context.rotate(bodyItem.GetAngle());
                this.context.drawImage(userData.image, -userData.radius, -userData.radius);
                this.context.restore();
            }
            const result = { isAwake: isAwakeAnyBody, boxIsFull };
            return result;
        }
        stepWorld() {
            this.world.Step(1 / this.frameRate, 10, 10);
            this.world.ClearForces();
            const result = this.render();
            this.boxIsFull = result.boxIsFull;
            if (result.isAwake === false) {
                this.worker.postMessage({ cmd: 'Stop' });
                this.saveCoinsState();
            }
        }
        saveCoinsState() {
            const coinsState = {
                sessionId: this.roomContext.sessionID,
                coins: []
            };
            for (var bodyItem = this.world.GetBodyList(); bodyItem; bodyItem = bodyItem.GetNext()) {
                if (bodyItem.GetType() != b2.Body.b2_dynamicBody)
                    continue;
                const coinAsset = bodyItem.GetUserData();
                if (coinAsset == null || coinAsset.coinType == null)
                    continue;
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
        restoreCoinsState() {
            const coinsStateJson = sessionStorage.getItem('coinsState') || '';
            if (coinsStateJson == '')
                return;
            const coinsState = JSON.parse(coinsStateJson);
            if (coinsState.sessionId != this.roomContext.sessionID) {
                sessionStorage.removeItem('coinsState');
                return;
            }
            coinsState.coins.forEach(state => this.createCoin(state));
            const coinImages = this.coinAssets.map(asset => asset.image);
            new Promise((resolve) => {
                const checkAllCoinImagesLoaded = () => { if (coinImages.every(img => img.complete))
                    resolve(); };
                coinImages.forEach(img => img.addEventListener('load', () => { checkAllCoinImagesLoaded(); }));
                checkAllCoinImagesLoaded();
            }).then(() => {
                this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
            });
        }
    }
    NaaS.nagesenBoxController = new NagesenBoxController(NaaS.roomContextService, NaaS.urlService, NaaS.hubConnService, NaaS.tweetService);
})(NaaS || (NaaS = {}));
