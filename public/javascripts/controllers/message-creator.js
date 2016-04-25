/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').controller('MessageCreatorCtrl', ['$scope', '$routeParams', 'server', function ($scope, $routeParams, server) {
    $scope.newMessage = '';
    $scope.createMessage = function () {
        if ($scope.newMessage == '') {
            return
        }
        server.createMessage({
            message: $scope.newMessage,
            creator: $scope.me,
            _roomId: $routeParams._roomId
        });
        $scope.newMessage = '';
    }

}]);