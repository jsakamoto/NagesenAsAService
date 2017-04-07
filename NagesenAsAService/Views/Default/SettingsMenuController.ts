﻿namespace NaaS {

    class SettingsMenuController {
        public static instance: SettingsMenuController;

        public visible: boolean;

        constructor(
            public settings: SettingsService,
            private hubClient: HubClientService,
            private $scope: ng.IScope
        ) {
            SettingsMenuController.instance = this;

            this.visible = false;
            $scope.$watch(() => this.visible, (newValue, oldValue) => {
                if (oldValue === true && newValue === false) {
                    console.log('FIRE');
                    hubClient.hub.invoke('UpdateSettings', _app.roomNumber, settings.twitterHashtag, settings.allowDisCoin);
                }
            });
        }

        public toggleVisible(): void {
            this.$scope.$apply(() => {
                this.visible = !this.visible;
            });
        }

        public hide(): void {
            this.$scope.$apply(() => this.visible = false);
        }
    }
    angular.module('theApp').controller('settingsMenuController', ['settings', 'hubClient', '$scope', SettingsMenuController]);

    $(() => {
        $('#settings-button').click(e => {
            e.preventDefault();
            e.stopPropagation();
            SettingsMenuController.instance.toggleVisible();
        });
        $('#settings-container').click(e => {
            e.stopPropagation();
        });
        $(document).click(e => {
            SettingsMenuController.instance.hide();
        })
    });
}
