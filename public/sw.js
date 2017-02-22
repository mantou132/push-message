this.addEventListener('push', function(event) {
    var payload = {};
    try {
        payload = event.data.json();
    } catch(e) {
        console.log('发送的消息为：', event.data.text())
    }
    this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: './push.png',
        data: payload.data
    }).then(e =>
        console.log(e)
    ).catch(err =>
        console.log(err)
    );
});
this.addEventListener('notificationclick', function(event) {
    console.log(event.notification.data);
    this.clients.openWindow(event.notification.data && event.notification.data.url).then(e =>
        event.notification.close()
    );
});
