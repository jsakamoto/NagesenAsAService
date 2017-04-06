namespace NaaS {
    var app = angular.module('app', []);
    app.controller('indexController', function ($scope: any) {
        $scope.roomNumber = null;
    });

    $(() => {
        $(document).on('click', 'a.disabled', e => {
            e.preventDefault();
        });
    });
} 