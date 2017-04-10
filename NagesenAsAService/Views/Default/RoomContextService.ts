namespace NaaS {

    export interface RoomContextSummary {
        sessionID: string
        allowDisCoin: boolean;
    }

    export interface RoomContext extends RoomContextSummary {
        roomNumber: number;
        title: string;
        twitterHashtag: string;
        countOfLike: number;
        countOfDis: number;
    }

    export class RoomContextService implements RoomContext {
        public roomNumber: number;
        public sessionID: string
        public title: string;
        public twitterHashtag: string;
        public allowDisCoin: boolean;
        public countOfLike: number;
        public countOfDis: number;

        constructor() {
            this.roomNumber = 0;
            this.sessionID = '';
            this.title = '';
            this.twitterHashtag = '';
            this.allowDisCoin = false;
            this.countOfLike = 0;
            this.countOfDis = 0;
        }
    }
    angular.module('theApp').service('roomContext', [RoomContextService]);
}