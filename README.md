
#简介
使用 [Webextension API](https://developer.mozilla.org/en-US/Add-ons/WebExtensions)做的，兼容Chrome以及安卓Firefox（需小许修改）。

#用途
将当前标签以消息推送的方式同步给其它设备

##优点
1. 不要额外安装App
2. 推送消息能缓存

#原理
[Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)；

#兼容
Firefox 45+

#使用
1. 装上扩展进行注册
2. 在其它支持[Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)的浏览器上打开地址 [https://test.594mantou.com:8000/](https://test.594mantou.com:8000/)登陆
3. 在扩展popup向注册的设备推送当前标签
