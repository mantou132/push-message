var express = require('express');
var path = require('path');
var https = require('https');
var bodyParser = require('body-parser');
var storage = require('node-shared-cache');
var config = require('../config');
var database = new storage.Cache(config.database['push-message'], 52428800);
var webPush = require('web-push');
    webPush.setGCMAPIKey(config.gcm);

var credentials = {
    key: config.webserver['push-message'].ssl.key,
    cert: config.webserver['push-message'].ssl.cert
};
var app = express();

app.use(bodyParser.urlencoded({extended: false, strict: false }));
app.use(bodyParser.json({
    limit: '500kb',
}));
app.use(bodyParser.text({type: 'text/*'}));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Methods', 'get, post');
    next();
});
/**
 * {
 *     <username>: {
 *         <alias>: {
 *             userPublicKey: <userPublicKey>:String,
 *             userAuth: <userAuth>:Striang,
 *             endpointUrl: <endpointUrl>:String
 *         }
 *         ...
 *     }
 *     ...
 * }
 */
// 注册设备
app.post('/sub', function (req, res) {
    var alias, data;
    var un = req.body.username,
        al = req.body.alias,
        pk = req.body.userPublicKey,
        ak = req.body.userAuth,
        eu = req.body.endpointUrl;
    if (!(un && al && pk && ak && eu)) return res.sendStatus(400);
    if (!database[un]) return res.sendStatus(404);
    var user = database[un];
    data = {
        userPublicKey: pk,
        userAuth: ak,
        endpointUrl: eu,
        pushing: 0
    };
    if (user[al] && eu !== user[al].endpointUrl) {
        alias = al + Object.keys(user).length;
        user[alias] = data;
    } else {
        user[al] = user[al] || data;
    }
    database[un] = user;
    res.send(alias || al);
});
// 扩展：注册用户
app.post('/reg', function (req, res) {
    var un = req.body.username;
    if (database[un]) return res.status(400).end('用户名已被注册！');
    database[un] = {};
    res.send('OK');
});
// 扩展： 获取注册的设备
app.get('/sub', function (req, res) {
    var un = req.query.username;
    if (!un) return res.sendStatus(400);
    if (!database[un]) return res.sendStatus(404);
    res.send(database[un]);
});
// 扩展： 发送消息
app.post('/push', function (req, res) {
    var un = req.body.username,
        ta = req.body.targetAlias,
        dt = req.body.data;
    if (!(un && ta && dt)
        || !dt.url
        || !database[un]
        || !database[un][ta])
        return res.sendStatus(400);
    var endpoint = database[un][ta];
    endpoint.pushing++;
    webPush.sendNotification(endpoint.endpointUrl, {
        userPublicKey: endpoint.userPublicKey,
        userAuth: endpoint.userAuth,
        payload: JSON.stringify({
            title: 'Web Push',
            body: 'Push扩展发来一个链接: ' + (dt.title || '点击查看内容'),
            data: dt
        })
    }).then(response => {
        res.send('OK');
        endpoint.pushing--;
    }).catch(WebPushError => {
        res.status(400).end(WebPushError)
        endpoint.pushing--;
    });
});

app.use(express.static(path.join(__dirname, 'publish'), {maxAge: 86400000 }));

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(8000);
