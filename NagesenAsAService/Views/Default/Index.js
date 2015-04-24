var NaaS;
(function (NaaS) {
    var app = angular.module('app', []);
    app.controller('indexController', function ($scope) {
        $scope.roomNumber = null;
    });
    $(function () {
        $(document).on('click', 'a.disabled', function (e) {
            e.preventDefault();
        });
    });
})(NaaS || (NaaS = {}));
//# sourceMappingURL=Index.js.map