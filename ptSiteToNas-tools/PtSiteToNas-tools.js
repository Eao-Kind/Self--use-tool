// ==UserScript==
// @name         PtSiteToNas-tools
// @namespace    http://tampermonkey.net/
// @version      1.1.4
// @description  站点cookie发送到nastools站点管理。
// @author       Kind

// @match   https://hdhome.org/index.php
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

// @grant       GM_xmlhttpRequest
// @grant       GM_cookie
// ==/UserScript==
// 可以删除所有的match，仅保留一个 @match https://*/index.php 但使用完毕后记得关闭脚本。默认新加站点优先级为2

// 设置nas-tools的访问地址，如http://192.168.1.2:300
let nastoolurl = "http://192.168.1.204:300";
// 获取nas-tools的安全密钥，基础设置-安全-API密钥
var token = "L4eYq9tfPZ3CsEaM";
// 如果油猴插件是测试版，请填写BETA,否则置空或改成其他任意字符
var tampermonkeyVersion = "BETA";
// 下面这些不用修改
var siteJson;
var dorandom = "/do?random=0.19956351081249935";


(function () {
    'use strict';
    main();
})();

async function getUserSitesByApi(){
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "POST",
            url: nastoolurl + "/api/v1/site/sites",
            headers: {
                'Origin': nastoolurl,
                "Authorization":token,
            },
            onload: function (response) {
                    console.log("【Debug】nas-tools请求userSite成功,status:",JSON.parse(response.responseText).code);
                    // console.log(response.responseText);
                    var data = JSON.parse(response.responseText);
                    resolve(data.data.user_sites)
                },
                onerror: function (response) {
                    console.log("【Debug】nas-tools请求userSite失败");
                }
        })
    })
}

async function sendSiteToNastools(data) {
    data = "cmd=update_site&data=" + encodeURI(JSON.stringify(data));
    GM_xmlhttpRequest({
        method: "POST",
        url: nastoolurl + dorandom,
        headers : {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': nastoolurl,
            'X-Requested-With': 'XMLHttpRequest',
        },
        data: data,
        onload: function (response) {
                console.log("【Debug】nas-tools请求成功,status:",JSON.parse(response.responseText).code); // code : true 为请求成功，参数不对返回非法请求
                // console.log(response.responseText);
            },
            onerror: function (response) {
                console.log("nas-tools更新站点请求失败");
            }
    });
    console.log("【Debug】站点信息发送完毕");
}

async function getData() {
    console.log("【Debug】开始获取PT站点信息");
    var data = {};
    var ptUrl = document.URL;
    if (ptUrl.length > 50){
        console.log("【Debug】btschool盾");
        return false;
    }
    var ptTitle = (document.title + "").split('::')[0];
    const pattern = /[`~!@#$^\-&*()=|{}':;'\\\[\]\.<>\/?~！@#￥……&*（）——|{}【】'；：""'。，、？\s]/g; // 去除( "等
    ptTitle = ptTitle.replace(pattern, "").substr(0,15);
    var ptCookie = document.cookie;
    if (tampermonkeyVersion == "BETA") {
        GM_cookie('list', {
            url: location.href
        }, (cookies) => {
            ptCookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            console.log('【Debug】cookie:', ptCookie);
        });
    }

        // 默认配置
    data.site_id = "";
    data.site_name = ptTitle;
    data.site_pri = 2;
    data.site_rssurl = "";
    data.site_signurl = ptUrl;
    data.site_cookie = ptCookie;
    data.site_note = "Y|1000|Y";
    var user_sites = await getUserSitesByApi();
    for (var i = 0, l = user_sites.length; i < l; i++) {
        if (user_sites[i].signurl == ptUrl) {
            var temp = user_sites[i]
            console.log("【Debug】查询到nas-tools中该站点的信息");
            if(temp.cookie == ptCookie){
                console.log("【Debug】cookie未过期，退出脚本");
                return false;
            }
            data.site_id = temp.id;
            data.site_name = temp.name;
            data.site_pri = temp.pri;
            data.site_rssurl = temp.rssurl;
            data.site_signurl = ptUrl;
            data.site_cookie = ptCookie; // GM_cookie
            data.site_note = temp.parse + '|' + temp.rule + '|' + temp.unread_msg_notify;
            break;
        }
    }
    return data;
}

async function main() {
    var data = await getData();
    if(data==false) return ;
    await sendSiteToNastools(data);
}


async function oldGetData() {
    // 旧nas-tools版本不支持api获取站点信息，使用该方法
    var data = {};
    var ptCookie = "";
    GM_cookie('list', {
        url: location.href
    }, (cookies) => {
        ptCookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log('【Debug】cookie:', ptCookie);
    });
    // var ptCookie = document.cookie;
    var ptTitle = (document.title + "").split('::')[0];
    const pattern = /[`~!@#$^\-&*()=|{}':;'\\\[\]\.<>\/?~！@#￥……&*（）——|{}【】'；：""'。，、？\s]/g; // 去除( "等
    ptTitle = ptTitle.replace(pattern, "")
        // console.log('ptTitle', ptTitle);
    var ptUrl = document.URL;
    siteJson = await getSiteJson(); // {name:site_id}
    data.site_signurl = ptUrl;
    data.site_cookie = ptCookie;
    data.site_name = ptTitle;
    if (ptTitle in siteJson) {
        console.log("【Debug】", ptTitle + " 站点已存在，site_id:", siteJson[ptTitle]);
        var info = await getSiteinfo(siteJson[ptTitle]); // 获取更详细的site信息
        console.log("【Debug】siteInfo:", info);
        if (ptCookie == info.cookie) {
            console.log("【Debug】cookie未过期，不进行更新")
            return 0;
        }
        data.site_id = siteJson[ptTitle];
        data.site_pri = info.pri;
        data.site_rssurl = info.rssurl;
        data.site_note = info.parse + "|" + info.rule;
    } else {
        console.log("【Debug】新站点:" + ptTitle);
        data.site_id = "";
        data.site_pri = "";
        data.site_rssurl = "";
        data.site_note = "Y|1000"
    }
    return data;
}

async function getSiteJson() {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "POST",
            url: nastoolurl + "/site",
            headers: {
                'Origin': nastoolurl,
            },
            onload: function (response) {
                    console.log("【Debug】nas-tools 请求站点信息成功,status:",response.status);
                    // console.log(response.responseText);
                    siteJson = infoToJson(response.responseText);
                   // console.log("【Debug】siteJson:"+ siteJson);
                    resolve(siteJson);
                },
                onerror: function (response) {
                    console.log("nastools 请求失败");
                }
        });
    })
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

async function getSiteinfo(site_id) {
    var data = {
        "id": site_id
    }
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "POST",
            url: nastoolurl + dorandom,
            headers: {
                'Origin': nastoolurl,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            data: "cmd=get_site&data=" + encodeURI(JSON.stringify(data)),
            onload: function (response) {
                    console.log("【Debug】nas-tools请求Siteinfo成功,status:",response.status);
                    // console.log(response.responseText);
                    var info = JSON.parse(response.responseText);
                    resolve(info.site)
                },
                onerror: function (response) {
                    console.log("【Debug】nas-tools请求Siteinfo失败");
                }
        })
    })
}