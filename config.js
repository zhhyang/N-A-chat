/**
 * Created by Freeman on 2016/4/12.
 */

var config = {

    cookieSecret: 'nachat',
    key: 'connect_sid',
    //mongodb

    db: 'nachat',
    host: '127.0.0.1',
    port: 27017,


    // redis 配置，默认是本地
    redis_host: '127.0.0.1',
    redis_port: 6379

};


module.exports = config;