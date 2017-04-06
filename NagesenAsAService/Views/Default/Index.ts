namespace NaaS {
    var app = angular.module('app', []);

    class IndexController {

        public roomNumber: number;

        public get inputIsNotFull(): boolean {
            if (this.roomNumber === null) return true;
            else return this.roomNumber.toString().length !== 4;
        }

        constructor() {
            this.roomNumber = null;
        }
    }

    app.controller('indexController', [IndexController]);

    $(() => {
        $(document).on('click', 'a.disabled', e => {
            e.preventDefault();
        });
    });
} 