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
/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').config(function ($routeProvider,$locationProvider) {
   /* $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });*/
    $routeProvider.
    when('/rooms',{
        templateUrl: '/pages/rooms.html',
        controller: 'RoomsCtrl'
    }).
    when('/rooms/:_roomId',{
        templateUrl: '/pages/room.html',
        controller: 'RoomCtrl'
    }).
    when('/login',{
        templateUrl: '/pages/login.html',
        controller: 'LoginCtrl'
    }).
    otherwise({
        redirectTo: '/login'
    })
    
});
/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').controller('LoginCtrl',['$scope', '$location', 'server',function ($scope,$location,server) {
    $scope.login = function () {
        server.login($scope.email).then(function () {
            $location.path('/rooms');
        },function () {
            $location.path('/login');
        })
    }
}]);
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
/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').controller('RoomCtrl',['$scope', '$routeParams', 'socket', 'server',function ($scope,$routeParams,socket,server) {

    $scope.room = server.getRoom($routeParams._roomId);

    server.joinRoom({
        user: $scope.me,
        room: {
            _id: $routeParams._roomId
        }
    });
    
    $scope.$on('$routeChangeStart', function() {
        server.leaveRoom({
            user: $scope.me,
            _roomId: $routeParams._roomId
        })
    });
    
}]);
/**
 * Created by Freeman on 2016/4/14.
 */
angular.module('NAChat').controller('RoomsCtrl',['$scope', '$location','socket', 'server',function ($scope,$location,socket,server) {
    var rooms = server.getAllRooms();
    $scope.searchRoom = function () {
        if ($scope.searchKey) {
            $scope.filteredRooms = $scope.rooms.filter(function(room) {
                return room.name.indexOf($scope.searchKey) > -1
            })
        } else {
            $scope.filteredRooms = $scope.rooms;
        }

    };
    $scope.createRoom = function () {
        server.createRoom({
            name:$scope.searchKey
        });
    };
    $scope.filteredRooms = $scope.rooms = rooms;

    $scope.enterRoom = function (room) {
        $location.path('/rooms/' + room._id)
    };
    $scope.$watchCollection('rooms', function() {
        $scope.searchRoom();
    });
}]);
/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').directive('autoScrollToBottom',function () {
    return {
        link:function (scope,element,attrs) {
            scope.$watch(
                function() {
                    return element.children().length;
                },
                function() {
                    element[0].scrollTop= element[0].scrollHeight-element[0].clientHeight;
                }
            );
        }
    }
});
/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').directive('ctrlEnterBreakLine',function () {

    return function(scope, element, attrs) {
        var ctrlDown = false
        element.bind("keydown", function(evt) {
            if (evt.which === 17) {
                ctrlDown = true
                setTimeout(function() {
                    ctrlDown = false
                }, 1000)
            }
            if (evt.which === 13) {
                if (ctrlDown) {
                    element.val(element.val() + '\n')
                } else {
                    scope.$apply(function() {
                        scope.$eval(attrs.ctrlEnterBreakLine);
                    });
                    evt.preventDefault()
                }
            }
        });
    };
});
/**
 * Created by freeman on 16-4-23.
 */
angular.module('NAChat').factory('server',['$cacheFactory', '$q', '$http', 'socket',function ($cacheFactory, $q, $http, socket) {
    var cache = window.cache = $cacheFactory('nachat');
    socket.on('nachat',function (data) {
        switch (data.action){
            case 'roomData':
                if(data._roomId){
                    angular.extend(cache.get(data._roomId), data.data);
                }else {
                    data.data.forEach(function (room) {
                        cache.get('rooms').push(room)
                    })
                }
                break;
            case 'leaveRoom':
                var leave = data.data;
                var _userId = leave.user._id;
                var _roomId = leave.user._roomId;
                cache.get(_roomId).users = cache.get(_roomId).users.filter(function(user) {
                    return user._id != _userId
                });
                cache.get('rooms') && cache.get('rooms').forEach(function(room) {
                    if (room._id === _roomId) {
                        room.users = room.users.filter(function(user) {
                            return user._id !== _userId
                        })
                    }
                });
                break;

            case 'roomAdded':
                cache.get('rooms').push(data.data)
                break;
            case 'joinRoom':
                var join = data.data
                var _userId = join.user._id;
                var _roomId = join.room._id;
                if (!cache.get(_roomId)) {
                    cache.get('rooms').forEach(function (room) {
                        if (room._id === _roomId) {
                            cache.put(_roomId, room)
                        }
                    })
                }
                cache.get(_roomId).users.push(join.user)
                break;
            case 'messageAdded':
                var message = data.data;
                cache.get(message._roomId).messages.push(message)
                break
        }
    });
    socket.on('err', function (data) {
        console.log(data)
    });

    return {
        validate: function() {
            var deferred = $q.defer();
            $http({
                url: '/api/validate',
                method: 'GET'
            }).success(function(user) {
                angular.extend(this.getUser(), user)
                deferred.resolve()
            }.bind(this)).error(function(data) {
                deferred.reject()
            });
            return deferred.promise;
        },
        getUser: function() {
            if (!cache.get('user')) {
                cache.put('user', {})
            }
            return cache.get('user')
        },
        login:function (email) {
            var deferred = $q.defer();
            $http({
                url: '/api/login',
                method: 'POST',
                data: {
                    email: email
                }
            }).success(function(user) {
                angular.extend(cache.get('user'), user)
                deferred.resolve()
            }).error(function() {
                deferred.reject()
            });
            return deferred.promise;
        },
        logout:function () {
            var deferred = $q.defer();
            $http({
                url: '/api/logout',
                method: 'GET'
            }).success(function() {
                var user = cache.get('user')
                for (key in user) {
                    if (user.hasOwnProperty(key)) {
                        delete user[key]
                    }
                }
                deferred.resolve()
            });
            return deferred.promise;
        },
        getAllRooms:function () {
            if (!cache.get('rooms')) {
                cache.put('rooms', [])
                socket.emit('nachat', {
                    action: 'getAllRooms'
                })
            }
            return cache.get('rooms');
        },
        getRoom:function (_roomId) {
            if (!cache.get(_roomId)) {
                cache.put(_roomId, {
                    users: [],
                    messages: []
                });
                socket.emit('nachat', {
                    action: 'getAllRooms',
                    data: {
                        _roomId: _roomId
                    }
                })
            }
            return cache.get(_roomId)
        },
        createRoom: function(room) {
            socket.emit('nachat', {
                action: 'createRoom',
                data: room
            })
        },

        joinRoom:function (join) {
            socket.emit('nachat', {
                action: 'joinRoom',
                data: join
            })
        },
        leaveRoom:function (leave) {
            socket.emit('nachat', {
                action:'leaveRoom',
                data:leave
            })
        },
        createRoom: function(room) {
            socket.emit('nachat', {
                action: 'createRoom',
                data: room
            })
        },
        createMessage: function(message) {
            socket.emit('nachat', {
                action: 'createMessage',
                data: message
            })
        }
    }
}]);
/**
 * Created by Freeman on 2016/4/12.
 */
/**
 *
 * */
angular.module('NAChat').factory('socket',function ($rootScope) {

    var socket = io();
    return {
        on:function (eventName,callback) {
            socket.on(eventName,function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket,args);
                })
            })
        },
        emit:function (eventName,data,callback) {
            socket.emit(eventName,data,function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback){
                        callback.apply(socket,args);
                    }
                });
            })
        }
    }
});
