namespace NaaS {
    export interface RoomState {
        countOfLike: number;
        countOfDis: number;
    }

    export class RoomStateService implements RoomState {
        public countOfLike: number;
        public countOfDis: number;

        constructor() {
            this.countOfLike = 0;
            this.countOfDis = 0;
        }
    }
    angular.module('theApp').service('roomState', [RoomStateService]);
}