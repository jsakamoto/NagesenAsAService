namespace NaaS {

    export class SettingsService {
        public twitterHashtag: string;
        public allowDisCoin: boolean;

        constructor() {
            this.twitterHashtag = '';
            this.allowDisCoin = false;
        }
    }
    angular.module('theApp').service('settings', [SettingsService]);
}