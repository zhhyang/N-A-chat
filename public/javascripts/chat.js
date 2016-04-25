/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat',['ngRoute','angularMoment']).
        run(['$window', '$rootScope', '$location', 'server',function ($window, $rootScope, $location, server) {

    $window.moment.locale('zh-cn');


    server.validate().then(function () {
        if ($location.path() === '/login') {
            $location.path('/rooms')
        }
    },function () {
        $location.path('/login')
    });

    $rootScope.me = server.getUser();

    $rootScope.logout = function () {
        server.logout().then(function () {
            $location.path('/login')
        });
    };
    
}]);