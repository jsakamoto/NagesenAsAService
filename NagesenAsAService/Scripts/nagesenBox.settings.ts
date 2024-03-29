﻿namespace NaaS {
    class NagesenBoxSettingsController {

        private get roomContext(): RoomContext { return this.roomContextService.roomContext; }

        private visibleSettings: boolean = false;

        private settingsContainerElement: HTMLElement | null = null;
        private titleInputElement: HTMLInputElement | null = null;
        private twitterHashtagInputElement: HTMLInputElement | null = null;
        private allowDisCoinInputElement: HTMLInputElement | null = null;
        private unitOfLikeInputElement: HTMLInputElement | null = null;
        private unitOfDisInputElement: HTMLInputElement | null = null;

        constructor(
            private roomContextService: RoomContextService,
            private urlService: UrlService,
            private hubConn: HubConnectionService
        ) {
            this.init();
            this.update();
        }

        private init(): void {
            const settingButtonElement = document.getElementById('settings-button');
            if (settingButtonElement !== null) settingButtonElement.addEventListener('click', e => this.onClickSettingButton());

            this.settingsContainerElement = document.getElementById('settings-container');
            this.titleInputElement = document.getElementById('session-title-input') as HTMLInputElement | null;
            this.twitterHashtagInputElement = document.getElementById('twitter-hashtag-input') as HTMLInputElement | null;
            this.unitOfLikeInputElement = document.getElementById('unit-of-like-input') as HTMLInputElement | null;
            this.unitOfDisInputElement = document.getElementById('unit-of-dis-input') as HTMLInputElement | null;
            this.allowDisCoinInputElement = document.getElementById('allow-dis-coin-input') as HTMLInputElement | null;

            if (this.titleInputElement !== null) this.titleInputElement.addEventListener('input', e => this.onInputTitle());
            if (this.twitterHashtagInputElement !== null) this.twitterHashtagInputElement.addEventListener('input', e => this.onInputTwitterHashtag());
            if (this.unitOfLikeInputElement !== null) this.unitOfLikeInputElement.addEventListener('input', e => this.onInputUnitOfLike());
            if (this.unitOfDisInputElement !== null) this.unitOfDisInputElement.addEventListener('input', e => this.onInputUnitOfDis());
            if (this.allowDisCoinInputElement !== null) this.allowDisCoinInputElement.addEventListener('change', e => this.onChageAllowDisCoin());
            const resetRoomButton = document.getElementById('reset-room-button');
            if (resetRoomButton !== null) resetRoomButton.addEventListener('click', e => this.onClickResetRoomButton());
            const settingsMask = document.getElementById('settings-mask');
            if (settingsMask !== null) settingsMask.addEventListener('click', e => this.onClickSettingsMask());

            this.roomContextService.subscribeChanges((invoker: any) => this.update(invoker));

            this.update();
        }

        private update(invoker?: any): void {
            if (
                this.settingsContainerElement !== null &&
                this.titleInputElement !== null &&
                this.twitterHashtagInputElement !== null &&
                this.unitOfLikeInputElement !== null &&
                this.unitOfDisInputElement !== null &&
                this.allowDisCoinInputElement !== null
            ) {
                this.settingsContainerElement.classList.toggle('visible', this.visibleSettings);

                if (this === invoker) return;

                if (this.titleInputElement.value !== this.roomContext.title) this.titleInputElement.value = this.roomContext.title;
                if (this.twitterHashtagInputElement.value !== this.roomContext.twitterHashtag) this.twitterHashtagInputElement.value = this.roomContext.twitterHashtag || '';
                if (this.unitOfLikeInputElement.value !== this.roomContext.unitOfLikeCoin) this.unitOfLikeInputElement.value = this.roomContext.unitOfLikeCoin || '';
                if (this.unitOfDisInputElement.value !== this.roomContext.unitOfDisCoin) this.unitOfDisInputElement.value = this.roomContext.unitOfDisCoin || '';
                if (this.allowDisCoinInputElement.checked !== this.roomContext.allowDisCoin) this.allowDisCoinInputElement.checked = this.roomContext.allowDisCoin;
            }
        }

        private onClickSettingButton(): void {
            this.visibleSettings = !this.visibleSettings;
            this.update();
        }

        private onClickSettingsMask(): void {
            this.visibleSettings = false;
            this.update();
        }

        private changeRoomSetings(action: (context: RoomContext) => void): void {
            this.roomContextService.update(action, this);
            this.hubConn.updateRoomSettingsAsync(this.urlService.roomNumber, this.roomContext);
        }

        private onInputTitle(): void {
            this.changeRoomSetings(context => {
                if (this.titleInputElement === null) return;
                context.title = this.titleInputElement.value;
            });
        }

        private onInputTwitterHashtag(): void {
            this.changeRoomSetings(context => {
                if (this.twitterHashtagInputElement === null) return;
                context.twitterHashtag = this.twitterHashtagInputElement.value;
            });
        }

        private onInputUnitOfLike(): void {
            this.changeRoomSetings(context => {
                if (this.unitOfLikeInputElement === null) return;
                context.unitOfLikeCoin = this.unitOfLikeInputElement.value;
            });
        }

        private onInputUnitOfDis(): void {
            this.changeRoomSetings(context => {
                if (this.unitOfDisInputElement === null) return;
                context.unitOfDisCoin = this.unitOfDisInputElement.value;
            });
        }

        private onChageAllowDisCoin(): void {
            this.changeRoomSetings(context => {
                if (this.allowDisCoinInputElement === null) return;
                context.allowDisCoin = this.allowDisCoinInputElement.checked;
            });
        }

        private async onClickResetRoomButton(): Promise<void> {
            const res = confirm(NaaS.localize.ConfirmResetRoom);
            if (res === true) {
                await this.hubConn.resetScoreAsync(this.urlService.roomNumber);
            }
        }

        onResetedScore(newSessionId: string): void {
            this.roomContext.sessionID = newSessionId;
            this.roomContext.countOfLike = 0;
            this.roomContext.countOfDis = 0;
            this.update();
        }
    }

    export const nagesenBoxSettingsController = new NagesenBoxSettingsController(
        roomContextService,
        urlService,
        hubConnService);
}