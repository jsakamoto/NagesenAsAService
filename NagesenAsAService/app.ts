/// <reference path="scripts/typings/signalr/signalr.d.ts" />
/// <reference path="scripts/typings/angularjs/angular.d.ts" />
interface Window {
    _app: { roomNumber: number };
}

interface ThrowingData {
    throwPoint: number;
    typeOfZeni: number;
}

interface IScope extends ng.IScope {
    title: string;
}

var b2 = {
    Vec2: Box2D.Common.Math.b2Vec2
    , AABB: Box2D.Collision.b2AABB
    , BodyDef: Box2D.Dynamics.b2BodyDef
    , Body: Box2D.Dynamics.b2Body
    , FixtureDef: Box2D.Dynamics.b2FixtureDef
    , Fixture: Box2D.Dynamics.b2Fixture
    , World: Box2D.Dynamics.b2World
    , MassData: Box2D.Collision.Shapes.b2MassData
    , PolygonShape: Box2D.Collision.Shapes.b2PolygonShape
    , CircleShape: Box2D.Collision.Shapes.b2CircleShape
    , DebugDraw: Box2D.Dynamics.b2DebugDraw
    , MouseJointDef: Box2D.Dynamics.Joints.b2MouseJointDef
};

class RoomController {
    hub: HubProxy;
    $scope: IScope;
    context: CanvasRenderingContext2D;
    world: any;

    private worldWidth: number;
    private worldHeight: number;
    private worldScale = 30.0;
    private frameRate = 60;

    constructor($scope: IScope) {
        this.$scope = $scope;

        var canvas = <HTMLCanvasElement>document.getElementById('canvas');
        this.context = canvas.getContext('2d');
        this.worldWidth = canvas.width;
        this.worldHeight = canvas.height;

        this.hub = $.connection.hub.createHubProxy('DefaultHub');

        this.hub.on('Throw', (data: ThrowingData) => {
            var circleRadius = 40;
            this.createCircle(this.world,
                circleRadius + (0 | ((this.worldWidth - 2 * circleRadius) * data.throwPoint)),
                -circleRadius,
                circleRadius);
        });

        $.connection.hub
            .start()
            .then(() => this.hub.invoke('EnterRoom', window._app.roomNumber))
            .then(r => $scope.$apply(() => {
                $scope.title = (<any>r).title;
            }));

        this.initWorld();
        this.runWorld();
    }

    public Throw(typeOfZeni: number) {
        this.hub.invoke('Throw', window._app.roomNumber, typeOfZeni);
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
        this.world = new b2.World(
            new b2.Vec2(0, 100), // 重力方向
            true                 // Sleepの可否
            );
        this.createFixedBox(0, 0, 2.0, this.worldHeight);
        this.createFixedBox(0, this.worldHeight - 2, this.worldWidth, 2.0);
        this.createFixedBox(this.worldWidth - 2, 0, 2.0, this.worldHeight);

        this.world.SetDebugDraw(this.getDebugDraw());
    }

    private runWorld() {
        window.setInterval(() => {
            this.world.Step(1 / this.frameRate, 10, 10);
            this.world.DrawDebugData();
            this.world.ClearForces();
        }, 1000 / this.frameRate);
    }

    private createFixedBox(x: number, y: number, width: number, height: number) {
        var bodyDef = new b2.BodyDef;
        bodyDef.type = b2.Body.b2_staticBody;

        // オブジェクトの設定
        var fixDef = new b2.FixtureDef;
        fixDef.density = 1.0;     // 密度
        fixDef.friction = 0.8;    // 摩擦係数
        fixDef.restitution = 0.5; // 反発係数

        // 床の設置
        fixDef.shape = new b2.PolygonShape;
        var shape: any = fixDef.shape;
        shape.SetAsBox(width / this.worldScale, height / this.worldScale);
        bodyDef.position.Set(x / this.worldScale, y / this.worldScale);
        this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    }

    private createCircle(world, x, y, r) {
        var bodyDef = new b2.BodyDef;
        bodyDef.type = b2.Body.b2_dynamicBody;

        // オブジェクトの設定
        var fixDef = new b2.FixtureDef;
        fixDef.density = 1.0;     // 密度
        fixDef.friction = 0.8;     // 摩擦係数
        fixDef.restitution = 0.5;  // 反発係数
        fixDef.shape = new b2.CircleShape(r / this.worldScale);

        // 円形オブジェクトの設置
        bodyDef.position.x = x / this.worldScale;
        bodyDef.position.y = y / this.worldScale;
        //bodyDef.userData = { shape_type: 'circle', img: circleImg, radius: r };
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    }
}

var theApp = angular.module('theApp', []);
theApp.controller('roomController', RoomController);