// ==UserScript==
// @name         PtSiteToNas-tools
// @author       Kind
// @description  PT站点cookie发送到nastools站点管理
// @namespace    https://greasyfork.org/zh-CN/scripts/450509-ptsitetonas-tools


// @match   https://xxxx.com/index.php

// @icon         https://kp.m-team.cc//favicon.ico
// @version      1.2.1
// @grant       GM_xmlhttpRequest
// @grant       GM_cookie
// @license      GPL-3.0 License
// ==/UserScript==

/*
日志：
    20220924：适配nas-tools 2.1.0版本。
    20220914：适配nas-tools 2.0.5版本。
*/

// 设置nas-tools的访问地址，如http://192.168.1.2:300
let nastoolurl = "http://192.168.1.204:300";
// 获取nas-tools的安全密钥，基础设置-安全-API密钥
var token = "L4eYq9tfPZ3CsEaM";
// 如果油猴插件是测试版(可获取更多cookie)，请填写BETA
var tampermonkeyVersion = "B___";
// 自定义配置：解析rss，日常观影，不通知，ua可以删除从而使用内置
var my_site_note = "Y|1000|N|Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/535.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/535.36";
// 自定义配置：默认优先级为"2"
var my_site_pri = "2"
// 自定义配置：签到Q、订阅D、刷流S，默认不刷流、统计T
var my_site_include = "QDT"
// 下面这些不用修改
var userSitesApi = "/api/v1/site/sites"
var siteJson;
var dorandom = "/do?random=0.19956351081249935";
// this.$$ = this.jQuery;

(function () {
    'use strict';
    main();
})();

async function getUserSitesByApi(){
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "POST",
            url: nastoolurl + userSitesApi,
            headers: {
                'Origin': nastoolurl,
                "Authorization":token,
            },
            onload: function (response) {
					var data = JSON.parse(response.responseText);
                    console.log("【Debug】nas-tools请求userSite成功,status:",data.code);
                    // console.log(response.responseText);
                    resolve(data.data.user_sites)
                },
                onerror: function (response) {
                    console.log("【Debug】nas-tools请求userSite失败");
                    reject("");
                }
        })
    })
}

async function sendSiteToNastools(data) {
    data = "cmd=update_site&data=" + encodeURIComponent(JSON.stringify(data)); // JSON.stringify 时候遇到rssurl中的&会自动分割
    console.log(data)
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
                console.log("【Debug】nas-tools请求发送成功");
                if (JSON.parse(response.responseText).code == "true"){ // code : true 为请求成功
                    console.log("【Debug】添加站点失败，可能由于nas-tools更新导致参数不对");
                }
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
        console.log("【Debug】可能是cf盾");
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
    if (ptCookie == ""){
        console.log("【Debug】获取的cookie为空，退出脚本");
        return false
	}
    // 默认配置
    data.site_id = "";
    data.site_name = ptTitle;
    data.site_pri = my_site_pri;
    data.site_rssurl = "";
    data.site_signurl = ptUrl;
    data.site_cookie = ptCookie;
    data.site_include = my_site_include;
    data.site_note = my_site_note;
    var user_sites = await getUserSitesByApi();
	if (user_sites == ""){ return false }
    var host_url = ptUrl.substring(8,).replace("/index.php",""); // 解决因index不是签到url导致nas-tools签到失败
    for (var i = 0, l = user_sites.length; i < l; i++) {
        if (user_sites[i].signurl.search(host_url)!==-1) {
            var temp = user_sites[i]
            console.log("【Debug】查询到nas-tools中该站点的信息:",temp.name);
            if(temp.cookie == ptCookie){
                console.log("【Debug】cookie未过期，退出脚本");
                return false;
            }
            data.site_id = temp.id;
            data.site_name = temp.name;
            data.site_pri = temp.pri;
            data.site_rssurl = temp.rssurl; // rss中存在&导致后面把json转换字符串在编码时候出现分割，先encode一下,但是后面在encode时候会出错
            data.site_signurl = temp.signurl;
            data.site_cookie = ptCookie;
            data.site_include = ""
            if(temp.signin_enable == true){data.site_include += "Q";} // 签到
            if(temp.rss_enable == true){data.site_include += "D";} // rss
            if(temp.brush_enable == true){data.site_include += "S";} // 刷流
            if(temp.statistic_enable == true){data.site_include += "T";} // 统计
            data.site_note = temp.parse + '|' + temp.rule + '|' + temp.unread_msg_notify + '|' + temp.ua;
            break;
        }
    }
    return data;
}

async function main() {
    var data = await getData();
    if(data==false) return ;
    // await ajax_post("update_site",data,"")
    await sendSiteToNastools(data);
}


async function ajax_post(cmd, data, handler){
    // @require        https://lib.baomitu.com/jquery/3.6.0/jquery.min.js
    data = {
        cmd: cmd,
        data: JSON.stringify(data)
    };
    $$.ajax({ // (已屏蔽:mixed-content) 无法在https里面发生http请求，因此暂时不使用
        type: "POST",
        url: nastoolurl + dorandom,
        dataType: "json",
        data: data,
        cache: false,
        timeout: 0,
        success: "", // 待更新
        error: function(){ // 待更新
        }
    });
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
