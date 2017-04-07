var NaaS;
(function (NaaS) {
    var SettingsMenuController = (function () {
        function SettingsMenuController(settings, hubClient, $scope) {
            var _this = this;
            this.settings = settings;
            this.hubClient = hubClient;
            this.$scope = $scope;
            SettingsMenuController.instance = this;
            this.visible = false;
            $scope.$watch(function () { return _this.visible; }, function (newValue, oldValue) {
                if (oldValue === true && newValue === false) {
                    console.log('FIRE');
                    hubClient.hub.invoke('UpdateSettings', _app.roomNumber, settings.twitterHashtag, settings.allowDisCoin);
                }
            });
        }
        SettingsMenuController.prototype.toggleVisible = function () {
            var _this = this;
            this.$scope.$apply(function () {
                _this.visible = !_this.visible;
            });
        };
        SettingsMenuController.prototype.hide = function () {
            var _this = this;
            this.$scope.$apply(function () { return _this.visible = false; });
        };
        return SettingsMenuController;
    }());
    angular.module('theApp').controller('settingsMenuController', ['settings', 'hubClient', '$scope', SettingsMenuController]);
    $(function () {
        $('#settings-button').click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            SettingsMenuController.instance.toggleVisible();
        });
        $('#settings-container').click(function (e) {
            e.stopPropagation();
        });
        $(document).click(function (e) {
            SettingsMenuController.instance.hide();
        });
    });
})(NaaS || (NaaS = {}));
//# sourceMappingURL=SettingsMenuController.js.map