/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat',['ngRoute','angularMoment']).
        run(function ($window, $rootScope, $http, $location) {

    $window.moment.locale('zh-cn');
    
    
    $rootScope.logout = function () {
        $http({
            url: '/api/logout',
            method: 'GET'
        }).success(function () {
            $rootScope.me = null;
            $location.path('/login')
        })
    };
    
    $rootScope.$on('login', function (evt, me) {
        $rootScope.me = me;
    })
    
});