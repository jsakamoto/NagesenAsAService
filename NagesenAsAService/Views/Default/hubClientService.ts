namespace NaaS {

    /** SignalR の接続状態を示す定数です。 */
    const enum SignalRConnectionState {
        Connecting = 0,
        Connected = 1,
        Reconnectiong = 2,
        Disconnected = 4
    }

    export class HubClientService {

        public hub: SignalR.Hub.Proxy;

        constructor(
            private roomState: RoomStateService,
            private $rootScope: ng.IRootScopeService
        ) {
            var hubConn = $.hubConnection();

            // SiganlR 切断時の再接続処理を配線
            var reconnectTimer = { id: null as number };
            hubConn.stateChanged(args => {
                if (args.newState == SignalRConnectionState.Disconnected) {
                    if (reconnectTimer.id == null) {
                        reconnectTimer.id = setInterval(() => this.startHubConnection(hubConn), 5000);
                    }
                }
                else if (reconnectTimer.id != null) {
                    clearInterval(reconnectTimer.id);
                    reconnectTimer.id = null;
                }
            });

            this.hub = hubConn.createHubProxy('DefaultHub');

            this.startHubConnection(hubConn);
        }

        private startHubConnection(hubConn: SignalR.Hub.Connection): void {
            hubConn.start()
                .then(() => this.hub.invoke('EnterRoom', _app.roomNumber))
                .then((roomState: RoomState) => this.$rootScope.$apply(() => {
                    this.roomState.countOfLike = roomState.countOfLike;
                    this.roomState.countOfDis = roomState.countOfDis;
                }));
        }

    }
    angular.module('theApp').service('hubClient', ['roomState', '$rootScope', HubClientService]);
}