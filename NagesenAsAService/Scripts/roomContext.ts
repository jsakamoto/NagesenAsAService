namespace NaaS {
    export interface RoomContext {
        title: string,
        countOfLike: number,
        countOfDis: number,
        allowDisCoin: boolean,
        sessionID: string,
        twitterHashtag?: string | undefined
    }
}