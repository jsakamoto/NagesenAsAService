/// <reference path="scripts/typings/signalr/signalr.d.ts" />
/// <reference path="scripts/typings/angularjs/angular.d.ts" />
var b2 = {
    Vec2: Box2D.Common.Math.b2Vec2,
    AABB: Box2D.Collision.b2AABB,
    BodyDef: Box2D.Dynamics.b2BodyDef,
    Body: Box2D.Dynamics.b2Body,
    FixtureDef: Box2D.Dynamics.b2FixtureDef,
    Fixture: Box2D.Dynamics.b2Fixture,
    World: Box2D.Dynamics.b2World,
    MassData: Box2D.Collision.Shapes.b2MassData,
    PolygonShape: Box2D.Collision.Shapes.b2PolygonShape,
    CircleShape: Box2D.Collision.Shapes.b2CircleShape,
    DebugDraw: Box2D.Dynamics.b2DebugDraw,
    MouseJointDef: Box2D.Dynamics.Joints.b2MouseJointDef
};
var RoomController = (function () {
    function RoomController($scope) {
        var _this = this;
        this.worldScale = 30.0;
        this.frameRate = 60;
        this.$scope = $scope;
        var canvas = document.getElementById('canvas');
        this.context = canvas.getContext('2d');
        this.worldWidth = canvas.width;
        this.worldHeight = canvas.height;
        this.hub = $.connection.hub.createHubProxy('DefaultHub');
        this.hub.on('Throw', function (data) {
            var circleRadius = 40;
            _this.createCircle(_this.world, circleRadius + (0 | ((_this.worldWidth - 2 * circleRadius) * data.throwPoint)), -circleRadius, circleRadius);
        });
        $.connection.hub.start().then(function () { return _this.hub.invoke('EnterRoom', window._app.roomNumber); }).then(function (r) { return $scope.$apply(function () {
            $scope.title = r.title;
        }); });
        this.initWorld();
        this.runWorld();
    }
    RoomController.prototype.Throw = function (typeOfZeni) {
        this.hub.invoke('Throw', window._app.roomNumber, typeOfZeni);
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
        this.world = new b2.World(new b2.Vec2(0, 100), true);
        this.createFixedBox(0, 0, 2.0, this.worldHeight);
        this.createFixedBox(0, this.worldHeight - 2, this.worldWidth, 2.0);
        this.createFixedBox(this.worldWidth - 2, 0, 2.0, this.worldHeight);
        this.world.SetDebugDraw(this.getDebugDraw());
    };
    RoomController.prototype.runWorld = function () {
        var _this = this;
        window.setInterval(function () {
            _this.world.Step(1 / _this.frameRate, 10, 10);
            _this.world.DrawDebugData();
            _this.world.ClearForces();
        }, 1000 / this.frameRate);
    };
    RoomController.prototype.createFixedBox = function (x, y, width, height) {
        var bodyDef = new b2.BodyDef;
        bodyDef.type = b2.Body.b2_staticBody;
        // オブジェクトの設定
        var fixDef = new b2.FixtureDef;
        fixDef.density = 1.0; // 密度
        fixDef.friction = 0.8; // 摩擦係数
        fixDef.restitution = 0.5; // 反発係数
        // 床の設置
        fixDef.shape = new b2.PolygonShape;
        var shape = fixDef.shape;
        shape.SetAsBox(width / this.worldScale, height / this.worldScale);
        bodyDef.position.Set(x / this.worldScale, y / this.worldScale);
        this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    };
    RoomController.prototype.createCircle = function (world, x, y, r) {
        var bodyDef = new b2.BodyDef;
        bodyDef.type = b2.Body.b2_dynamicBody;
        // オブジェクトの設定
        var fixDef = new b2.FixtureDef;
        fixDef.density = 1.0; // 密度
        fixDef.friction = 0.8; // 摩擦係数
        fixDef.restitution = 0.5; // 反発係数
        fixDef.shape = new b2.CircleShape(r / this.worldScale);
        // 円形オブジェクトの設置
        bodyDef.position.x = x / this.worldScale;
        bodyDef.position.y = y / this.worldScale;
        //bodyDef.userData = { shape_type: 'circle', img: circleImg, radius: r };
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    };
    return RoomController;
})();
var theApp = angular.module('theApp', []);
theApp.controller('roomController', RoomController);
//# sourceMappingURL=app.js.map