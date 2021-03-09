namespace NaaS {
    class NagesenControllerController {

        constructor() {
            const roomNumberHolder = document.getElementById('room-number-holder');
            const roomNumber = location.pathname.split('/')[2];
            roomNumberHolder!.textContent = roomNumber;
        }
    }

    export var controller: any = new NagesenControllerController();
}