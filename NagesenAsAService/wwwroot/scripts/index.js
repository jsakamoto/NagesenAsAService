"use strict";
var NaaS;
(function (NaaS) {
    class IndexController {
        constructor() {
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
            const res = await fetch('/api/rooms/new', { method: 'post' });
            if (res.status === 200) {
                const newRoomNumber = await res.json();
                location.href = `/room/${newRoomNumber}/box`;
            }
            else {
                const responseMessage = await res.text();
                const message = `Creating new room was failed. (HTTP Status ${res.status} ${responseMessage})`;
                console.error(message);
                alert(message);
            }
        }
        async onClickEnterRoomButton() {
            this.update();
            if (this.roomNumberAvailable === false)
                return;
            const res = await fetch(`/api/rooms/${this.roomNumber}/enter`, { method: 'post' });
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
    NaaS.controller = new IndexController();
})(NaaS || (NaaS = {}));
