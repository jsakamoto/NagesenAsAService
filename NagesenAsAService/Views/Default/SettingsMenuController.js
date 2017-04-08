var NaaS;
(function (NaaS) {
    var SettingsMenuController = (function () {
        function SettingsMenuController(roomContext, hubClient, $scope) {
            var _this = this;
            this.roomContext = roomContext;
            this.hubClient = hubClient;
            this.$scope = $scope;
            SettingsMenuController.instance = this;
            this.visible = false;
            $scope.$watch(function () { return _this.visible; }, function (newValue, oldValue) {
                if (oldValue === true && newValue === false) {
                    hubClient.hub.invoke('UpdateSettings', roomContext.roomNumber, roomContext.twitterHashtag, roomContext.allowDisCoin);
                }
            });
        }
        SettingsMenuController.prototype.toggleVisible = function () {
            var _this = this;
            this.$scope.$applyAsync(function () {
                _this.visible = !_this.visible;
            });
        };
        SettingsMenuController.prototype.hide = function () {
            var _this = this;
            this.$scope.$applyAsync(function () { return _this.visible = false; });
        };
        SettingsMenuController.prototype.resetRoom = function () {
            if (confirm(_app.localize.ConfirmResetRoom) == false)
                return;
            this.hubClient.hub.invoke('ResetRoom', this.roomContext.roomNumber);
            this.hide();
        };
        return SettingsMenuController;
    }());
    angular.module('theApp').controller('settingsMenuController', ['roomContext', 'hubClient', '$scope', SettingsMenuController]);
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