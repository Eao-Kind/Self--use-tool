// ==UserScript==
// @name         PtSiteToNas-tools
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       Kind

// @match   http://hdhome.org/index.php
// @match   http://pt.btschool.club/index.php
// @match   https://byr.pt/index.php
// @match   https://discfan.net/index.php
// @match   https://et8.org/index.php
// @match   https://filelist.io/index.php
// @match   https://hdchina.org/index.php
// @match   https://hdcity.leniter.org/index.php
// @match   https://hdsky.me/index.php
// @match   https://hudbt.hust.edu.cn/index.php
// @match   https://iptorrents.com/t
// @match   https://kp.m-team.cc/index.php
// @match   https://lemonhd.org/index.php
// @match   https://nanyangpt.com/index.php
// @match   https://npupt.com/index.php
// @match   https://ourbits.club/index.php
// @match   https://pt.eastgame.org/index.php
// @match   https://pt.hdbd.us/index.php
// @match   https://pt.keepfrds.com/index.php
// @match   https://pterclub.com/index.php
// @match   https://springsunday.net/index.php
// @match   https://u2.dmhy.org/index.php
// @match   https://www.beitai.pt/index.php
// @match   https://www.hdarea.co/index.php
// @match   https://www.hddolby.com/index.php
// @match   https://www.nicept.net/index.php
// @match   https://www.pthome.net/index.php
// @match   https://www.tjupt.org/index.php
// @match   https://www.torrentleech.org/index.php


// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// ==/UserScript==
let nanstoolurl = "http://ip:300"; // 请设置nas-tools的访问地址，如http://192.168.1.2:300
var siteJson;

(function () {
    'use strict';
    GM_xmlhttpRequest({
        method: "POST",
        url: nanstoolurl + "/site",
        headers: {
            'Origin': nanstoolurl,
        },
        onload: function (response) {
                console.log("nas-tools 请求站点信息成功");
                // console.log(response.responseText);
                siteJson = infoToJson(response.responseText);
                // console.log("【Debug】siteJson:"+ siteJson);
                sendSiteToNastools();
            },
            onerror: function (response) {
                console.log("nastools 请求失败");
            }
    });
})();

function sendSiteToNastools() {
    console.log("【Debug】开始获取PT站点信息");
    var ptCookie = document.cookie;
    console.log('【Debug】cookie', document.cookie);
    var ptTitle = (document.title + "").split('::')[0];
    const pattern = /[`~!@#$^\-&*()=|{}':;'\\\[\]\.<>\/?~！@#￥……&*（）——|{}【】'；：""'。，、？\s]/g; // 去除( "等
    ptTitle = ptTitle.replace(pattern, "")
    // console.log('ptTitle', ptTitle);
    var ptUrl = document.URL;
    var nasToolUpdateUrl = nanstoolurl + "/do?random=0.9810414943440304";
    let data = {};
    if (ptTitle in siteJson) {
        console.log("【Debug】",ptTitle + "的site_id:", siteJson[ptTitle]);
        data.site_id = siteJson[ptTitle];
    } else {
        console.log("【Debug】新站点:" + ptTitle);
        data.site_id = "";
    }
    data.site_name = ptTitle;
    data.site_pri = 1;
    data.site_rssurl = "";
    data.site_signurl = ptUrl;
    data.site_note = "Y|1000"
    data.site_cookie = ptCookie;
    data = "cmd=update_site&data=" + encodeURI(JSON.stringify(data));
    GM_xmlhttpRequest({
        method: "POST",
        url: nasToolUpdateUrl,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': nanstoolurl
        },
        data: data,
        onload: function (response) {
                console.log("【Debug】nas-tools请求成功,成功添加站点" + ptTitle); // code : true 为请求成功，参数不对返回非法请求
                // console.log(response.responseText);
            },
            onerror: function (response) {
                console.log("nas-tools更新站点请求失败");
            }
    });
    console.log("【Debug】站点信息发送完毕");
}

function infoToJson(text) {
    var re = /a href="javascript:remove_site(.*)" class="btn-action" title="删除站点"/g; // 正则提取site信息
    var temp = "";
    var json = {}
    while (temp = re.exec(text)) { // 获取site (name,site_id)
        // console.log(temp[1]);
        const pattern = /[`~!@#$^\-&*()=|{}':;'\\\[\]\.<>\/?~！@#￥……&*（）——|{}【】'；：""'。，、？\s]/g; // 去除( "等
        temp[1] = temp[1].replace(pattern, "")
        var arr = temp[1].split(','); // 字符串转数组
        // console.log(arr)
        json[arr[0]] = arr[1]; // 数组变json
    }
    console.log("【Debug】nas-tools站点信息转换为json", json);
    return json;
}
