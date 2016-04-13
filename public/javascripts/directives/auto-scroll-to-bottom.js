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
                    element.animate({
                        scrollTop: element.prop('scrollHeight')
                    }, 1000);
                }
            );
        }
    }
});