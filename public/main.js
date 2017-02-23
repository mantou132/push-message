var input = document.querySelector('input');
var alias = document.querySelector('.alias');
var loger = document.querySelector('.log');
var button = document.querySelector('button');

lscache.setBucket('push_');
navigator.serviceWorker.getRegistration().then(reg => {
    if (reg && lscache.get('subed')) {
        // 已经注册该设备
        document.body.dataset.state = 'subed';
        alias.textContent = lscache.get('userinfo').alias;
        login();
    } else if (reg && lscache.get('userinfo')) {
        button.disabled = false;
    } else if (reg) {
        subscribe(reg);
    } else {
        registerSW();
    }
});


button.addEventListener('click', e => {
    var data;
    e.preventDefault();
    if (!document.forms[0].checkValidity()) return;
    fetch('/sub', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            username: input.value,
            alias: browserName(),
            userPublicKey: lscache.get('userinfo').userPublicKey,
            userAuth: lscache.get('userinfo').userAuth,
            endpointUrl: lscache.get('userinfo').endpointUrl,
        })
    }).then(res => {
        if (!res.ok) throw res.statusText;
        return res.text();
    }).then(text => {
        lscache.set('subed', true);
        alias.textContent = text;
        data = lscache.get('userinfo');
        data.alias = text;
        data.username = input.value;
        lscache.set('userinfo', data);
        document.body.dataset.state = 'subed';
    }).catch(e => {
        loger.textContent = e;
    });
});

function chunkArray(array, size) {
    var start = array.byteOffset || 0;
    array = array.buffer || array;
    var index = 0;
    var result = [];
    while (index + size <= array.byteLength) {
        result.push(new Uint8Array(array, start + index, size));
        index += size;
    }
    if (index <= array.byteLength) {
        result.push(new Uint8Array(array, start + index));
    }
    return result;
}

function base64urlEncode(data) {
    var strmap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    data = new Uint8Array(data);
    var len = Math.ceil(data.length * 4 / 3); // base64
    return chunkArray(data, 3).map(chunk => [
        chunk[0] >>> 2,
        ((chunk[0] & 0x3) << 4) | (chunk[1] >>> 4),
        ((chunk[1] & 0xf) << 2) | (chunk[2] >>> 6),
        chunk[2] & 0x3f
    ].map(v => strmap[v]).join('')).join('').slice(0, len);
}

function registerSW() {
    navigator.serviceWorker.register('sw.js', {
        scope: './'
    }).then(subscribe);
}

function subscribe(reg) {
    reg.pushManager.subscribe({
        userVisibleOnly: true
    }).then(subscription => {
        button.disabled = false;
        lscache.set('userinfo', {
            userPublicKey: base64urlEncode(subscription.getKey('p256dh')),
            userAuth: base64urlEncode(subscription.getKey('auth')),
            endpointUrl: subscription.endpoint,
        });
    }).catch(e => {
        loger.textContent = '订阅失败！';
        console.log(e);
    });
}

function login() {
    fetch('/sub?username=' + lscache.get('userinfo').username).then(res => {
        return res.json();
    }).then(devicelist => {
        if (Object.keys(devicelist).indexOf(lscache.get('userinfo').alias) === -1) throw '该设备没有注册';
    }).catch(e => {
        console.log(e);
        delete document.body.dataset.state;
        lscache.flush();
    });
}
