
module.exports = {
  
  summary: 'the default rule for AnyProxy',

  /**
   * 
   * 
   * @param {object} requestDetail
   * @param {string} requestDetail.protocol
   * @param {object} requestDetail.requestOptions
   * @param {object} requestDetail.requestData
   * @param {object} requestDetail.response
   * @param {number} requestDetail.response.statusCode
   * @param {object} requestDetail.response.header
   * @param {buffer} requestDetail.response.body
   * @returns
   */
  *beforeSendRequest(requestDetail) {
    return null;
  },


  /**
   * 
   * 
   * @param {object} requestDetail
   * @param {object} responseDetail
   */
  *beforeSendResponse(requestDetail, responseDetail) {
    var keyWordArray = ['福利', '红包', '现金', '抽奖'];

     //https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzIzNzQyMzA1OA==&scene=124&devicetype=iPhone+OS9.3.2&version=16050320&lang=zh_CN&nettype=WIFI&a8scene=3&fontScale=100&pass_ticket=1Xej5zq%2FxWAXWghF%2Fw%2FfxgSs6WwzB69m7LbbUtBrzQGMPB45TX9dlmPfBUZINTA0&wx_header=1 
        var responseBody = responseDetail.response.body.toString();//转换变量为string
        if (/mp\/profile_ext\?action=urlcheck/i.test(requestDetail.url) 
            || /mp\/profile_ext\?action=home/i.test(requestDetail.url) ) {//当链接地址为公众号历史消息页面时(第二种页面形式)
             try{
              var reg = /var msgList = \'(.*?)\';/;//定义历史消息正则匹配规则（和第一种页面形式的正则不同）
              var ret = reg.exec(responseStr);
             
              dumpInfo(requestDetail.url);
              dumpInfo(ret[1]);
               //保存公众号名称和简介
              var mpInfo = [];
              var regName = /(.*)<\/strong>/gi;
              var name = regName.exec(responseStr);
            
              var regDes = /(.*?)<\/p>/gi;
              var des = regDes.exec(responseStr);
            
              var regIcon = /<img src="(.*)" id="icon">/gi;
              var icon = regIcon.exec(responseStr);
              mpInfo['name'] = name[1];
              mpInfo['des'] = des[1];
              mpInfo['icon'] = icon[1];
              dumpInfo(ret[1]);
              //strMpInfo = JSON.stringify(mpInfo);
              var jsonInfo = '{"name":"'+name[1]+'", "des":"'+des[1]+'", "icon":"'+ encodeURIComponent(icon[1])+ '"}';
              dumpInfo(ret[1]);
            } catch(e) {
              return null;
            }
            
         } else if (/mp\/profile_ext\?action=getmsg/i.test(requestDetail.url)){//第二种页面表现形式的向下翻页后的json
            dumpInfo('entry into get msg branch');
            try {
              var json = JSON.parse(responseStr);
              if (json.general_msg_list != []) {
                dumpInfo(json.general_msg_list.toString());
              }
            } catch(e) {
               return null;
            } 
            return null;
          } else if (/mp\/getappmsgext/i.test(requestDetail.url)) {//当链接地址为公众号文章阅读量和点赞量时
            dumpInfo('entry into getappmsgext branch');
            try {  
              dumpInfo(responseStr);
            } catch(e) {
                return null;
            }
            return null;
         } else if (/mp\/appmsg_comment/i.test(requestDetail.url)){//当链接地址为公众号文章阅读量和点赞量时
            dumpInfo('entry into appmsg_comment branch');
            try {  
              dumpInfo(responseStr);
            } catch(e) {
                return null;
            }
            return null;
         }  else if (/s\?__biz/i.test(requestDetail.url) || /mp\/rumor/i.test(requestDetail.url)) {//当链接地址为公众号文章时（rumor这个地址是公众号文章被辟谣了）
            dumpInfo('entry into getWxPost branch');
            var newResponse = Object.assign({}, responseDetail.response);
            try {
                //这里采用同步请求的方式，get请求完了之后就进入 callback()
                //nodejs 中的 http.get 方法是异步请求的，所以，http.get还没有请求完 就走到callback 方法，urllib-sync 同步请求的库 解决了
                // var request = require('urllib-sync').request;
                // var res = request(request_url + 'getWxPost.php');
                // newResponse.body += res.data.toString();
                var chineseContextRe =  /[^\u4E00-\u9FA5]/g;
                var body = responseDetail.response.body.toString();
                var dumpStr = body.replace(chineseContextRe, '' );
                dumpInfo('getWxPost Message Body :');
                dumpInfo(dumpStr);

                var find = false;
                var findKey = '';
                for (key in keyWordArray) {
                  if (dumpStr.indexOf(keyWordArray[key]) != -1) {
                    find = true;
                    findKey += keyWordArray[key] + '  ';
                  }
                }
                
                var util = require('util');
                if (find) {
                  var temp = '发布时间: %s, 公众号: [[%s]] 的文章 <<%s>> 找到了关键字: %s :)';
                  dumpInfo('');
                  dumpInfo('');
                  dumpInfo(util.format(temp, getMsgPublishTime(body), getName(body), getMsgTitle(body), findKey));
                  dumpInfo('');
                  dumpInfo('');

                  //save into file GZHInformation.txt
                  var date = new Date(); 
                  var dateStr = date.pattern("yyyy-MM-dd");
                  var log = util.format(temp, getMsgPublishTime(body), getName(body), getMsgTitle(body), findKey) + ', URL : ' + requestDetail.url;
                  if (cmpTime(dateStr, getMsgPublishTime(body)) < 3) {
                  	saveDataToFileWithAppend('GZHInformation' + date.pattern("yyyy-MM-dd") + '.txt', log);
              	  } else {
              	  	log = log + '   , ((此条公众号信息已经超过3天有效期))'
              	  }
              	  saveDataToFileWithAppend('visitLog' + date.pattern("yyyy-MM-dd") + '.txt', log);
                } else {
                  var temp = '发布时间: %s, 公众号: [[%s]] 的文章 <<%s>> 没有找到关键字:(';
                  dumpInfo('');
                  dumpInfo('');
                  dumpInfo(util.format(temp, getMsgPublishTime(body), getName(body), getMsgTitle(body)));
                  dumpInfo('');
                  dumpInfo('');

                  var date = new Date(); 
                  var dateStr = date.pattern("yyyy-MM-dd");
                  var log = util.format(temp, getMsgPublishTime(body), getName(body), getMsgTitle(body)) + ', URL : ' + requestDetail.url;

                  if (cmpTime(dateStr, getMsgPublishTime(body)) < 3) {
                  	//Do nothing
              	  } else {
              	  	log = log + '   , ((此条公众号信息已经超过3天有效期))'
              	  }
              	  saveDataToFileWithAppend('visitLog' + date.pattern("yyyy-MM-dd") + '.txt', log);
                }

                return {
                  response: newResponse
                };
            } catch(e) {
                 //var newDataStr = serverResData.toString();
              dumpInfo(e);
              var newDataStr = "catch error in getWxPost";
              newResponse.body += newDataStr;
              return {
                response: newResponse
              };
            }
            return null;
         } else {
          return null;
         }
  
  },

};

function cmpTime(time1, time2) {
   var data1 = time1.replace(/-/g, '');
   var data2 = time2.replace(/-/g, '');

   console.log(data1, '    ',  data2);
   return (parseInt(data1) - parseInt(data2)) % 70;
};

function saveDataToFileWithAppend(filename, str) {
	var fs = require("fs");
	fs.appendFile(filename, str + '\n', 'utf8' ,function(err) {  
    					if(err) {  
        					console.log(err);  
    					}  
				}); 
};

  function getName(str) {
    if (str != null) {
      var reg = new RegExp('var nickname = \"(.*?)\";', 'g');
      var ret = reg.exec(str);
      if (ret) {
        return ret[1];
      }
      // dumpInfo(ret.toString);
      return ret;
    }

    return '';
  };

  function getMsgTitle(str) {
    if (str != null) {
      var reg = new RegExp('var msg_title = \"(.*?)\";', 'g');
      var ret = reg.exec(str);
      if (ret) {
        return ret[1];
      }
      // dumpInfo(ret.toString);
      return ret;
    }

    return '';
  }

function getMsgPublishTime(str) {
  	if (str != null) {
  		var reg = new RegExp('var publish_time = \"(.*?)\"', 'g');
  		var ret = reg.exec(str);
  		if (ret) {
  			return ret[1];
  		}

  		return ret;
  	}

  	return '';
}


function dumpInfo(str) {
  var infoHead = '[[DUMP INFO]] : ';
  console.log(infoHead + str);
};


Date.prototype.pattern=function(fmt) {         
    var o = {         
    "M+" : this.getMonth()+1, //月份         
    "d+" : this.getDate(), //日         
    "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时         
    "H+" : this.getHours(), //小时         
    "m+" : this.getMinutes(), //分         
    "s+" : this.getSeconds(), //秒         
    "q+" : Math.floor((this.getMonth()+3)/3), //季度         
    "S" : this.getMilliseconds() //毫秒         
    };         
    var week = {         
    "0" : "/u65e5",         
    "1" : "/u4e00",         
    "2" : "/u4e8c",         
    "3" : "/u4e09",         
    "4" : "/u56db",         
    "5" : "/u4e94",         
    "6" : "/u516d"        
    };         
    if(/(y+)/.test(fmt)){         
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));         
    }         
    if(/(E+)/.test(fmt)){         
        fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[this.getDay()+""]);         
    }         
    for(var k in o){         
        if(new RegExp("("+ k +")").test(fmt)){         
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));         
        }         
    }         
    return fmt;         
};

//将json发送到服务器，str为json内容，url为历史消息页面地址，path是接收程序的路径和文件名
    function HttpPost(str,url,path) {
    var http = require('http');
    var data = {
        // str: encodeURIComponent(str),
        // url: encodeURIComponent(url)
        str:str,
        url:url
    };
    var content = require('querystring').stringify(data);
  
    var options = {
        method: "POST",
        host: "127.0.0.1",//注意没有http://，这是服务器的域名。
        port: 8008,
        path: "/"+path,//接收程序的路径和文件名
         headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                "Content-Length": content.length
            }
    };
   // console.log(content);
    console.log("++++++++++++++++++");
    console.log(options);
    var req = http.request(options, function (res) {
        console.log('STATUS:' + res.statusCode);
        //res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
      //加入post数据
    req.write(content);

    req.end();
};


//将json发送到服务器，str为json内容，url为历史消息页面地址，path是接收程序的路径和文件名
    function HttpPost(str,url,path) {
    var http = require('http');
    var data = {
        // str: encodeURIComponent(str),
        // url: encodeURIComponent(url)
        str:str,
        url:url
    };
    var content = require('querystring').stringify(data);
  
    var options = {
        method: "POST",
        host: "127.0.0.1",//注意没有http://，这是服务器的域名。
        port: 8008,
        path: "/"+path,//接收程序的路径和文件名
         headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                "Content-Length": content.length
            }
    };
   // console.log(content);
    console.log("++++++++++++++++++");
    console.log(options);
    var req = http.request(options, function (res) {
        console.log('STATUS:' + res.statusCode);
        //res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
      //加入post数据
    req.write(content);

    req.end();
}
