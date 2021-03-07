"use strict";
var NaaS;
(function (NaaS) {
    class IndexController {
        constructor() {
            this.roomNumber = '';
            const roomNumberInput = document.getElementById('room-number-input');
            roomNumberInput.addEventListener('input', _ => this.onInputRoomNumberInput(roomNumberInput.value));
            this.enterButton = document.getElementById('enter-button');
            const createNewRoomButton = document.getElementById('create-newroom-button');
            createNewRoomButton.addEventListener('click', _ => this.onClickCreateNewRoomButton());
        }
        onInputRoomNumberInput(roomNumber) {
            this.roomNumber = roomNumber;
            this.update();
        }
        update() {
            const roomNumberAvailable = /^\d{4}$/.test(this.roomNumber);
            this.enterButton.classList.toggle('disabled', !roomNumberAvailable);
            this.enterButton.href = roomNumberAvailable ? `/room/${this.roomNumber}` : '';
        }
        async onClickCreateNewRoomButton() {
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
    NaaS.controller = new IndexController();
})(NaaS || (NaaS = {}));
