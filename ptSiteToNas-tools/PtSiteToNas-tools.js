// ==UserScript==
// @name         PtSiteToNas-tools
// @author       Kind
// @description  PT站点cookie发送到nastools站点管理
// @namespace    http://tampermonkey.net/

// @version      2.8.0
// @grant       GM_xmlhttpRequest
// @grant       GM_cookie
// @grant       GM_setValue
// @grant       GM_getValue
// @license      GPL-3.0 License
// ==/UserScript==

/*
日志：
    20230124：适配nas-tools 2.8.0版本，下次更新保留ip地址和token到浏览器存储避免更新后重新填写。
    20221124：适配nas-tools 2.5.0版本。
    20221029：适配nas-tools 2.3.0版本。
    20220924：适配nas-tools 2.1.2版本。修复一些Bug
    20220924：适配nas-tools 2.1.0版本。
    20220914：适配nas-tools 2.0.5版本。
*/

// 设置nas-tools的访问地址，如http://192.168.1.2:300
let nastoolurl = "http://192.168.1.204:xxx";
// 获取nas-tools的安全密钥，基础设置-安全-API密钥
var token = "IMCIrXB69GQUlHD9xxx";
// 如果油猴插件是测试版(可获取更多cookie)，保持不变，否则改为"BET"
var tampermonkeyVersion = "BETA";
// 自定义配置：日常观影，下载设置默认（若预设则填写-1），解析rss，ua, 浏览器仿真，N 不用代理服务器，消息通知，字幕下载
var my_site_note = {"rule":"1000","download_setting":"", "parse":"Y","ua":navigator.userAgent,"chrome":"Y","proxy":"N","message":"Y","subtitle":"Y"};
// 自定义配置：默认优先级为"2"
var my_site_pri = "2"
// 自定义配置：签到Q、订阅D(未设置rss链接时无法订阅)、刷流S（未设置rss无法刷流）、统计T
var my_site_include = "QDST"
// 下面这些不用修改
var userSitesApi = "/api/v1/site/sites"
var siteJson;
var dorandom = "/do?random=0.19956351081249935";
// this.$$ = this.jQuery;
if (nastoolurl != "http://192.168.1.204:xxx"){
    GM_setValue("nastoolurl", nastoolurl);
    console.log("【DEBUG】当前nastools地址：" + nastoolurl);
}else{
    nastoolurl = GM_getValue("nastoolurl");
    console.log("【DEBUG】当前nastools地址：" + nastoolurl);
}

if (token != "IMCIrXB69GQUlHD9xxx"){
	GM_setValue("token", token);
	console.log("【DEBUG】当前token:" + token);
}else{
    token = GM_getValue("token");
    console.log("【DEBUG】当前token:" + token);
}

(function () {
    'use strict';
    main();
})();

async function getUserSitesByApi(){
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: nastoolurl + userSitesApi,
            headers: {
                'Origin': nastoolurl,
                "Authorization":token,
            },
            onload: function (response) {
		var data = JSON.parse(response.responseText);
                console.log("【Debug】nas-tools请求userSite成功,status:",data.code);
                // console.log(response.responseText);
                if(data.code==401){
		    console.log("【Debug】获取userSite失败，请检查密钥是否正确");}
		    resolve(data.data.user_sites)
                },
                onerror: function (response) {
                    console.log("【Debug】nas-tools请求userSite失败，请检查IP地址是否设置正确");
                    reject("");
                }
        })
    })
}

async function sendSiteToNastools(data) {
    data = "cmd=update_site&data=" + encodeURIComponent(JSON.stringify(data)); // JSON.stringify 时候遇到rssurl中的&会自动分割，不能用encode
    // console.log(data)
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
                if (JSON.parse(response.responseText).code !== true){ // code : true 为请求成功
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
    var ptCookie = document.cookie;
    if (tampermonkeyVersion == "BETA") {
        GM_cookie('list', { // 异步,如果在return data之前还没执行完，部分站点会导致cookie不全。
            url: location.href
        }, (cookies) => {
            ptCookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            console.log('【Debug】cookie:', ptCookie);
            // data.site_cookie = ptCookie;
        });
    }
    var ptUrl = document.URL;
    if (ptUrl.length > 50){
        console.log("【Debug】可能是cf盾，进入首页后再刷新一下页面");
        return false;
    }
    var ptTitle = (document.title + "").split('::')[0];
    const pattern = /[`~!@#$^\-&*()=|{}':;'\\\[\]\.<>\/?~！@#￥……&*（）——|{}【】'；：""'。，、？\s]/g; // 去除( "等
    ptTitle = ptTitle.replace(pattern, "").substr(0,15);
    if (ptCookie == "" && tampermonkeyVersion!="BETA"){
        console.log("【Debug】获取的cookie为空，请使用BETA版油猴，退出脚本");
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
    if (user_sites == ""){ return data } 			 // 第一次使用，一个站点都没有
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
            if(temp.signin_enable == true){data.site_include += "Q";} 	 // 签到
            if(temp.rss_enable == true){data.site_include += "D";} 	 // rss
            if(temp.brush_enable == true){data.site_include += "S";} 	 // 刷流
            if(temp.statistic_enable == true){data.site_include += "T";} // 统计
            // data.site_note = temp.parse + '|' + temp.rule + '|' + temp.unread_msg_notify + '|' + temp.ua + '|' + temp.chrome + '|' + temp.proxy; 2.5.0废弃
            data.site_note = {};
            data.site_note.rule = temp.rule;
            data.site_note.parse = temp.parse;
            data.site_note.ua = temp.ua;
            temp.chrome == true ? data.site_note.chrome = "Y" :data.site_note.chrome = "N";
            temp.proxy == true ? data.site_note.proxy = "Y" :data.site_note.proxy = "N";
            temp.message == true ? data.site_note.message = "Y" :data.site_note.message = "N";
            temp.subtitle == true ? data.site_note.subtitle = "Y" :data.site_note.subtitle = "N"
			data.site_note.download_setting = temp.download_setting
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
