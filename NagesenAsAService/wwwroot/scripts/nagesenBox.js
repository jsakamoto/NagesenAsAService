"use strict";
var NaaS;
(function (NaaS) {
    class NagesenBoxController {
        constructor() {
            const roomNumberHolder = document.getElementById('room-number-holder');
            const roomNumber = location.pathname.split('/')[2];
            roomNumberHolder.textContent = roomNumber;
        }
    }
    NaaS.controller = new NagesenBoxController();
})(NaaS || (NaaS = {}));
