"use strict";
var NaaS;
(function (NaaS) {
    class IndexController {
        constructor(httpClient) {
            this.httpClient = httpClient;
            this.roomNumber = '';
            this.roomNumberAvailable = false;
            const roomNumberInput = document.getElementById('room-number-input');
            roomNumberInput.addEventListener('input', _ => this.onInputRoomNumberInput(roomNumberInput.value));
            this.enterButton = document.getElementById('enter-button');
            const createNewRoomButton = document.getElementById('create-newroom-button');
            createNewRoomButton.addEventListener('click', _ => this.onClickCreateNewRoomButton());
            this.enterButton.addEventListener('click', _ => this.onClickEnterRoomButton());
        }
        onInputRoomNumberInput(roomNumber) {
            this.roomNumber = roomNumber;
            this.update();
        }
        update() {
            this.roomNumberAvailable = /^\d{4}$/.test(this.roomNumber);
            this.enterButton.classList.toggle('disabled', !this.roomNumberAvailable);
        }
        async onClickCreateNewRoomButton() {
            const reCAPTCHAResponse = await this.getreCAPTCHAResponseAsync();
            const res = await this.httpClient.postAsync('/api/rooms/new', { reCAPTCHAResponse });
            if (res.status === 200) {
                const newRoomNumber = await res.json();
                await this.httpClient.deleteAsync('/api/rooms/expired');
                location.href = `/room/${newRoomNumber}/box`;
            }
            else {
                const responseMessage = await res.text();
                const message = `Creating new room was failed. (HTTP Status ${res.status} ${responseMessage})`;
                console.error(message);
                alert(message);
            }
        }
        async getreCAPTCHAResponseAsync() {
            var _a;
            const grecaptchaScript = document.querySelector('script#grecaptcha');
            const sitekey = (_a = grecaptchaScript === null || grecaptchaScript === void 0 ? void 0 : grecaptchaScript.dataset.sitekey) !== null && _a !== void 0 ? _a : '';
            if (sitekey !== '' && typeof (grecaptcha) !== 'undefined') {
                await new Promise(resolve => grecaptcha.ready(() => resolve()));
                const reCAPTCHAResponse = await grecaptcha.execute(sitekey, { action: 'submit' });
                return reCAPTCHAResponse;
            }
            return '';
        }
        async onClickEnterRoomButton() {
            this.update();
            if (this.roomNumberAvailable === false)
                return;
            const res = await this.httpClient.postAsync(`/api/rooms/${this.roomNumber}/enter`);
            if (res.status === 404) {
                location.href = `/room/${this.roomNumber}`;
            }
            else if (res.status === 200) {
                const roomContext = await res.json();
                if (roomContext.isOwnedByCurrentUser)
                    location.href = `/room/${this.roomNumber}/box`;
                else
                    location.href = `/room/${this.roomNumber}`;
            }
            else {
                const responseMessage = await res.text();
                const message = `Entering room was failed. (HTTP Status ${res.status} ${responseMessage})`;
                console.error(message);
                alert(message);
            }
        }
    }
    NaaS.controller = new IndexController(NaaS.httpClientService);
})(NaaS || (NaaS = {}));
