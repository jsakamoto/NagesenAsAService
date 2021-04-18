namespace NaaS {
    class IndexController {

        private roomNumber: string = '';

        private roomNumberAvailable: boolean = false;

        private enterButton: HTMLAnchorElement;

        constructor(private httpClient: HttpClientService) {

            const roomNumberInput = document.getElementById('room-number-input') as HTMLInputElement;
            roomNumberInput.addEventListener('input', _ => this.onInputRoomNumberInput(roomNumberInput.value));

            this.enterButton = document.getElementById('enter-button') as HTMLAnchorElement;

            const createNewRoomButton = document.getElementById('create-newroom-button') as HTMLAnchorElement;
            createNewRoomButton.addEventListener('click', _ => this.onClickCreateNewRoomButton())
            this.enterButton.addEventListener('click', _ => this.onClickEnterRoomButton())
        }

        private onInputRoomNumberInput(roomNumber: string): void {
            this.roomNumber = roomNumber;
            this.update();
        }

        private update(): void {
            this.roomNumberAvailable = /^\d{4}$/.test(this.roomNumber);
            this.enterButton.classList.toggle('disabled', !this.roomNumberAvailable);
        }

        private async onClickCreateNewRoomButton(): Promise<void> {
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

        private async getreCAPTCHAResponseAsync(): Promise<string> {
            const grecaptchaScript = document.querySelector('script#grecaptcha') as HTMLScriptElement | null;
            const sitekey = grecaptchaScript?.dataset.sitekey ?? '';
            if (sitekey !== '' && typeof (grecaptcha) !== 'undefined') {
                await new Promise<void>(resolve => grecaptcha!.ready(() => resolve()));
                const reCAPTCHAResponse = await grecaptcha!.execute(sitekey, { action: 'submit' });
                return reCAPTCHAResponse;
            }
            return '';
        }

        private async onClickEnterRoomButton(): Promise<void> {
            this.update();
            if (this.roomNumberAvailable === false) return;

            const res = await this.httpClient.postAsync(`/api/rooms/${this.roomNumber}/enter`);
            if (res.status === 404/*Room not found */) {
                location.href = `/room/${this.roomNumber}`;
            }
            else if (res.status === 200) {
                const roomContext: RoomContext = await res.json();
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

    export var controller: any = new IndexController(httpClientService);
}
