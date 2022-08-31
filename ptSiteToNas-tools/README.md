# 使用步骤

**重要说明**

​	使用脚本更新站点cookie信息到nastools时，默认使用过滤规则为：日常观影，rss链接默认为空，优先级为 1。

​	也就是说如果手动设置了rss订阅地址，那么使用脚本更新时候地址会被置空。算一个缺陷吧，有空再弄了。

**油猴添加自定义脚本**

https://github.com/Eao-Kind/Self--use-tool/blob/main/PtSiteToNas-tools.js

![image-20220831111228976](README.assets/image-20220831111228976.png)

**访问nas-tools的web**

浏览器访问nas-tools，确保可以成功访问。然后修改脚本中的url地址

> et nanstoolurl = "http://ip:300"; // 请设置nas-tools的访问地址，如http://192.168.1.2:300



**开启脚本**

![image-20220831111322533](README.assets/image-20220831111322533.png)

注意，浏览器中站点的标签大部分需要符合以index.php为结尾，否则不会发送。

>  http://hdhome.org/index.php
>  http://pt.btschool.club/index.php

另外，MT的cookie脚本无法获取，需要手动添加。

开启脚本之后，在浏览器中一次性打开所有站点标签，即可发送站点信息至nas-tools。可打开F12控制台查看脚本运行信息。



**效果展示**

使用完毕后**关闭**脚本。

![image-20220831112211899](README.assets/image-20220831112211899.png)
