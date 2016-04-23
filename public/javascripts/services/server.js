/**
 * Created by freeman on 16-4-23.
 */
angular.module('NAChat').factory('server',['$cacheFactory', '$q', '$http', 'socket'],function ($cacheFactory, $q, $http, socket) {
    var cache = window.cache = $cacheFactory('nachat');
    socket.on('nachat',function (data) {
        switch (data.action){
            case 'roomData':
                if(data._roomId){
                    angular.extend(cache.get(data._roomId), data.data)
                }else {
                    data.data.forEach(function (room) {
                        cache.get('rooms').push(room)
                    })
                }
                break;
            case 'leaveRoom':
                var leave = data.data;
                var _userId = leave.user._id;
                var _roomId = leave.room._id;
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
                var _roomId = join.user._roomId;
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
        validate:function () {
            $http({
                url: '/api/validate',
                method: 'GET'
            }).success(function (user) {
                $rootScope.me = user;
                $location.path('/rooms');
            }).error(function (data) {
                $location.path('/login');
            });
        },
        getAllRooms:function (_roomId) {
            socket.emit('nachat',{
                action:'getAllRooms',
                _roomId:_roomId
            });
        }


    }
});