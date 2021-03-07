namespace NaaS {
    class IndexController {

        private roomNumber: string = '';

        private enterButton: HTMLAnchorElement;

        constructor() {

            const roomNumberInput = document.getElementById('room-number-input') as HTMLInputElement;
            roomNumberInput.addEventListener('input', _ => this.onInputRoomNumberInput(roomNumberInput.value));

            this.enterButton = document.getElementById('enter-button') as HTMLAnchorElement;

            const createNewRoomButton = document.getElementById('create-newroom-button') as HTMLAnchorElement;
            createNewRoomButton.addEventListener('click', _ => this.onClickCreateNewRoomButton())
        }

        private onInputRoomNumberInput(roomNumber: string): void {

            this.roomNumber = roomNumber;
            this.update();
        }

        private update(): void {
            const roomNumberAvailable = /^\d{4}$/.test(this.roomNumber);
            this.enterButton.classList.toggle('disabled', !roomNumberAvailable);
            this.enterButton.href = roomNumberAvailable ? `/room/${this.roomNumber}` : '';
        }

        private async onClickCreateNewRoomButton(): Promise<void> {
            const res = await fetch('/api/rooms/new', { method: 'post' });
            if (res.status === 200) {
                const newRoomNumber = await res.json();
                location.href = `/room/${newRoomNumber}`;
            }
            else {
                const responseMessage = await res.text();
                const message = `Creating new room was failed. (HTTP Status ${res.status} ${responseMessage})`;
                console.error(message);
                alert(message);
            }
        }
    }

    export const controller = new IndexController();
}
