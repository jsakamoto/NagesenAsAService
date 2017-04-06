var NaaS;
(function (NaaS) {
    var app = angular.module('app', []);
    var IndexController = (function () {
        function IndexController() {
            this.roomNumber = null;
        }
        Object.defineProperty(IndexController.prototype, "inputIsNotFull", {
            get: function () {
                if (this.roomNumber === null)
                    return true;
                else
                    return this.roomNumber.toString().length !== 4;
            },
            enumerable: true,
            configurable: true
        });
        return IndexController;
    }());
    app.controller('indexController', [IndexController]);
    $(function () {
        $(document).on('click', 'a.disabled', function (e) {
            e.preventDefault();
        });
    });
})(NaaS || (NaaS = {}));
//# sourceMappingURL=Index.js.map