var input = document.querySelector('input');
var ul = document.querySelector('ul');
var qrcode = document.querySelector('.qrcode');
var link = document.querySelector('.link');
var loger = document.querySelector('.log');
var host = 'https://push.xianqiao.wang';

document.addEventListener('click', function(e) {
    e.preventDefault();
    if (!document.body.dataset.state && !document.forms[0].checkValidity()) return;
    var action = e.target.dataset.action;
    if (action) {
        switch (action) {
            case '注册':
                regin();
                break;
            case '登陆':
                login();
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            default:
                push(e.target);
        }
    }
});
document.addEventListener('copy', function (e) {
    e.clipboardData.setData('text/plain', link.href);
    e.clipboardData.setData('text/html', '<b>' + link.href + '</b>');
    e.preventDefault(); // We want our data, not data from any selection, to be written to the clipboard
    link.title = '复制成功！！！';
});

function regin() {
    fetch(host + '/reg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
            username: input.value
        })
    }).then(res => {
        if (res.status !== 200 && res.status !== 304) throw res.statusText;
        return res.text();
    }).then(text => {
        if (text !== 'OK') throw text;
        localStorage.username = input.value;
        login();
    }).catch(e => loger.textContent = e);
}

function login() {
    fetch(host + '/sub?username=' + (input.value || localStorage.username)).then(res => {
        if (res.status !== 200 && res.status !== 304) throw res.statusText;
        return res.json();
    }).then(devicelist => {
        localStorage.username = input.value || localStorage.username;
        if (!Object.keys(devicelist).length) {
            localStorage.removeItem('deviceNotEmpty');
            return getQR();
        };
        let fg = document.createDocumentFragment();
        for (let alias in devicelist) {
            let li = document.createElement('li');
            li.dataset.action = alias;
            li.dataset.pushing = devicelist[alias].pushing || 0;
            fg.appendChild(li);
        }
        ul.textContent = '';
        localStorage.deviceNotEmpty = true;
        ul.appendChild(fg);
        document.body.dataset.state = 'logined';
    }).catch(e => {
        loger.textContent = e;
        delete document.body.dataset.state;
        localStorage.clear();
    });
}

function push(ele) {
    var url, title;
    // 取到当前标签信息
    new Promise((resolve, reject) => {
        chrome.tabs.query({active: true}, e => {
            resolve({
                url: e[0].url,
                title: e[0].title,
            });
        });
    }).then(info => {
        ele.dataset.pushing = ele.dataset.pushing - 0 + 1;
        return fetch(host + '/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({
                username: localStorage.username,
                targetAlias: ele.dataset.action,
                data: {
                    title: info.title,
                    url: info.url
                }
            })
        })
    }).then(res => {
        if (res.status !== 200 && res.status !== 304) throw res.statusText;
        return res.text();
    }).then(text => {
        ele.dataset.pushing = ele.dataset.pushing - 0 - 1;
    }).catch(e => {
        ele.dataset.pushing = ele.dataset.pushing - 0 - 1;
    });
}
function getQR() {
    chrome.runtime.sendMessage('getQR').then(src => {
        qrcode.src = src;
        link.href = chrome.runtime.getManifest().homepage_url;
    });
}
if (localStorage.username) {
    document.body.dataset.state = 'logined';
    login();
}
if (!localStorage.deviceNotEmpty) {
    getQR();
}