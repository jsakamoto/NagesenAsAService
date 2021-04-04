namespace NaaS {
    export interface RoomContext extends RoomContextSummary {
        countOfLike: number,
        countOfDis: number,
        isOwnedByCurrentUser: boolean
    }
}