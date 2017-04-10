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
    var theApp = angular.module('theApp', []);
    var Box;
    (function (Box) {
        var CoinAsset = (function () {
            function CoinAsset(imageUrl, imageRadius, seUrl) {
                this.imageUrl = imageUrl;
                this.imageRadius = imageRadius;
                this.seUrl = seUrl;
                this.image = this.resizeImage(imageUrl, 2 * imageRadius);
            }
            // 参考：http://elicon.blog57.fc2.com/blog-entry-109.html
            CoinAsset.prototype.resizeImage = function (src, new_size) {
                var image_data = new Image();
                var img0 = new Image();
                img0.onload = function () {
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
                };
                img0.src = src;
                return image_data;
            };
            return CoinAsset;
        }());
        var CoinAssets = new Array();
        CoinAssets[0 /* Like */] = new CoinAsset('/Content/images/coin.png', 20, null);
        CoinAssets[1 /* Dis */] = new CoinAsset('/Content/images/stone.png', 15, null);
        var RoomController = (function () {
            function RoomController(roomContext, hubClient, $scope, $http) {
                var _this = this;
                this.roomContext = roomContext;
                this.hubClient = hubClient;
                this.$scope = $scope;
                this.$http = $http;
                this.worldScale = 30.0;
                this.frameRate = 60;
                var canvas = document.getElementById('canvas');
                this.context = canvas.getContext('2d');
                this.worldWidth = canvas.width;
                this.worldHeight = canvas.height;
                this.hubClient.hub.on('Throw', this.OnThrow.bind(this));
                $scope.$watch(function () { return roomContext.sessionID; }, function (newVal, oldVal) {
                    if (newVal != '' && oldVal != '')
                        _this.initWorld();
                });
                this.initWorld();
                this.worker = new Worker('/Views/Default/BoxWorker.js');
                this.worker.addEventListener('message', this.OnWorkerMessage.bind(this));
                this.loadSoundAsset(0 /* Like */);
                this.loadSoundAsset(1 /* Dis */);
            }
            RoomController.prototype.loadSoundAsset = function (coinType) {
                $.ajax({
                    url: '/CoinSoundBase64/' + coinType
                }).then(function (base64str) {
                    CoinAssets[coinType].seUrl = 'data:audio/mp3;base64,' + base64str;
                });
            };
            RoomController.prototype.OnThrow = function (data) {
                this.worker.postMessage({ cmd: 'Enqueue', data: data });
            };
            RoomController.prototype.OnWorkerMessage = function (e) {
                switch (e.data.cmd) {
                    case 'Interval':
                        this.stepWorld();
                        break;
                    case 'Enqueue':
                        this.OnEnqueueThrowing(e.data.data);
                        break;
                }
            };
            RoomController.prototype.OnEnqueueThrowing = function (data) {
                var _this = this;
                var coinAsset = CoinAssets[data.typeOfCoin];
                var circleRadius = coinAsset.imageRadius;
                this.createCircle(this.world, circleRadius + (0 | ((this.worldWidth - 2 * circleRadius) * data.throwPoint)), -circleRadius, circleRadius, coinAsset.image);
                if (coinAsset.seUrl != null)
                    (new Audio(coinAsset.seUrl)).play();
                this.worker.postMessage({ cmd: 'Start', fps: this.frameRate });
                this.$scope.$apply(function () {
                    _this.roomContext.countOfLike = Math.max(_this.roomContext.countOfLike, data.countOfLike);
                    _this.roomContext.countOfDis = Math.max(_this.roomContext.countOfDis, data.countOfDis);
                });
            };
            RoomController.prototype.getDebugDraw = function () {
                var debugDraw = new b2.DebugDraw();
                debugDraw.SetSprite(this.context);
                debugDraw.SetDrawScale(this.worldScale);
                debugDraw.SetFillAlpha(0.5);
                debugDraw.SetLineThickness(1.0);
                debugDraw.SetFlags(b2.DebugDraw.e_shapeBit);
                return debugDraw;
            };
            RoomController.prototype.initWorld = function () {
                this.world = new b2.World(new b2.Vec2(0, 50), // 重力方向
                true // Sleepの可否
                );
                this.createFixedBox(0, 0, 2.0, this.worldHeight);
                this.createFixedBox(0, this.worldHeight - 2, this.worldWidth, 2.0);
                this.createFixedBox(this.worldWidth - 2, 0, 2.0, this.worldHeight);
                this.world.SetDebugDraw(this.getDebugDraw());
                this.world.ClearForces();
                this.render();
            };
            RoomController.prototype.stepWorld = function () {
                var _this = this;
                this.world.Step(1 / this.frameRate, 10, 10);
                //this.world.DrawDebugData();
                this.world.ClearForces();
                var isAwake = this.render();
                if (isAwake == false) {
                    this.worker.postMessage({ cmd: 'Stop' });
                    if (_app.isOwner) {
                        html2canvas(document.getElementById('box'), {
                            onrendered: function (canvas) {
                                _this.$http.post(_app.apiBaseUrl + '/ScreenShot', { imageDataUrl: canvas.toDataURL('image/jpeg', 0.6) });
                            }
                        });
                    }
                }
            };
            RoomController.prototype.createFixedBox = function (x, y, width, height) {
                var bodyDef = new b2.BodyDef;
                bodyDef.type = b2.Body.b2_staticBody;
                // オブジェクトの設定
                var fixDef = new b2.FixtureDef;
                fixDef.density = 1.0; // 密度
                fixDef.friction = 0.5; // 摩擦係数
                fixDef.restitution = 0.4; // 反発係数
                // 床の設置
                fixDef.shape = new b2.PolygonShape;
                var shape = fixDef.shape;
                shape.SetAsBox(width / this.worldScale, height / this.worldScale);
                bodyDef.position.Set(x / this.worldScale, y / this.worldScale);
                this.world.CreateBody(bodyDef).CreateFixture(fixDef);
            };
            RoomController.prototype.createCircle = function (world, x, y, r, img) {
                var bodyDef = new b2.BodyDef;
                bodyDef.type = b2.Body.b2_dynamicBody;
                // オブジェクトの設定
                var fixDef = new b2.FixtureDef;
                fixDef.density = 100.0; // 密度
                fixDef.friction = 0.5; // 摩擦係数
                fixDef.restitution = 0.5; // 反発係数
                fixDef.shape = new b2.CircleShape(r / this.worldScale);
                // 円形オブジェクトの設置
                bodyDef.position.x = x / this.worldScale;
                bodyDef.position.y = y / this.worldScale;
                bodyDef.userData = { img: img, r: r };
                world.CreateBody(bodyDef).CreateFixture(fixDef);
            };
            RoomController.prototype.render = function () {
                this.context.clearRect(0, 0, this.worldWidth, this.worldHeight);
                var isAwake = false;
                for (var bodyItem = this.world.GetBodyList(); bodyItem; bodyItem = bodyItem.GetNext()) {
                    if (bodyItem.GetType() == b2.Body.b2_dynamicBody) {
                        isAwake = isAwake || bodyItem.IsAwake();
                        var pos = bodyItem.GetPosition();
                        this.context.save();
                        var userData = bodyItem.GetUserData();
                        if (userData && userData.img && userData.img.complete) {
                            var slideX = pos.x * this.worldScale;
                            var slideY = pos.y * this.worldScale;
                            this.context.translate(slideX, slideY);
                            this.context.rotate(bodyItem.GetAngle());
                            this.context.drawImage(userData.img, -userData.r, -userData.r);
                        }
                        this.context.restore();
                    }
                }
                return isAwake;
            };
            RoomController.prototype.tweet = function () {
                var text = "\u3053\u306E\u67A0\u306B" + this.roomContext.countOfLike + "\u5186\u5206\u306E\u6295\u3052\u92AD" +
                    (this.roomContext.allowDisCoin ? "\u3068" + this.roomContext.countOfDis + "Dis" : '') +
                    "\u304C\u96C6\u307E\u308A\u307E\u3057\u305F\u2606";
                var url = _app.apiBaseUrl + '/TwitterShare?';
                url += 'text=' + encodeURIComponent(text);
                url += '&url=' + encodeURIComponent(_app.apiBaseUrl + '/screenshot/' + this.roomContext.sessionID);
                window.open(url);
            };
            return RoomController;
        }());
        Box.RoomController = RoomController;
        theApp.controller('roomController', ['roomContext', 'hubClient', '$scope', '$http', RoomController]);
        $(function () {
            $('#lnk-tweet').click(function (e) {
                e.preventDefault();
                var roomController = angular.element(document.getElementById('box')).controller();
                roomController.tweet();
            });
            $(window).on('beforeunload', function (e) { return _app.localize.IfYouLeaveThisPageYouLostCoinsImage; });
        });
    })(Box || (Box = {}));
})(NaaS || (NaaS = {}));
//# sourceMappingURL=Box.js.map