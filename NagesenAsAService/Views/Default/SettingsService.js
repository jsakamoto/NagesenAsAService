var NaaS;
(function (NaaS) {
    var SettingsService = (function () {
        function SettingsService() {
            this.twitterHashtag = '';
            this.allowDisCoin = false;
        }
        return SettingsService;
    }());
    NaaS.SettingsService = SettingsService;
    angular.module('theApp').service('settings', [SettingsService]);
})(NaaS || (NaaS = {}));
//# sourceMappingURL=SettingsService.js.map