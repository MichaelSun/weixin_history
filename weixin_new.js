var currentPaperVisitLog = './visitLog/currentPaperVisitLog.txt';

var log4js = require('log4js');
log4js.configure({
	appenders: {
		ruleConsole: {
			type: 'console'
		},
		ruleFile: {
			type: 'dateFile',
			filename: 'logs/weixin_',
			pattern: 'yyyy-MM-dd.log',
			maxLogSize: 10 * 1000 * 1000,
			numBackups: 3,
			alwaysIncludePattern: true
		}
	},

	categories: {
		default: {
			appenders: ['ruleConsole', 'ruleFile'],
			level: 'info'
		}
	}
});
var logger = log4js.getLogger('normal');

module.exports = {

	summary: 'Michael Sun Weixin histroy rule',

	* beforeSendRequest(requestDetail) {
		//var util = require("util")
		//dumpInfo(util.inspect(requestDetail.requestOptions,{depth:null}));
		//dumpInfo(util.inspect(requestDetail,{depth:null}));

		//dumpInfo("[[dumpInfo]] " + requestDetail.url);
		if (requestDetail.requestOptions.hostname == 'sgqweixin') {
			if (requestDetail.requestOptions.path.indexOf('begin') != -1) {
				saveDataToFile(currentPaperVisitLog, JSON.stringify(new VisitLogClass()));
				var date = new Date();
				var splitedStr = requestDetail.requestOptions.path.split('=');
				var beginLine = 'BeginSessionIndex=' + splitedStr[1];
				dumpInfo('    ');
				dumpInfo('    ');
				dumpInfo('>>>>>>>>>>>>>>>>>>>>>>>>>>>  BEGIN SESSION ' + splitedStr[1] + " <<<<<<<<<<<<<<<<<<<<<<<");
				// saveDataToFileWithAppend('GZHInformation' + date.pattern("yyyy-MM-dd") + '.txt', beginLine);
				saveDataToFileWithAppend('visitLog' + date.pattern("yyyy-MM-dd") + '.txt', requestDetail.url);

				return {
					response: {
						statusCode: 200,
						header: {
							'content-type': 'text/html'
						},
						body: beginLine
					}
				};

			} else if (requestDetail.requestOptions.path.indexOf('end') != -1) {
				var date = new Date();
				var splitedStr = requestDetail.requestOptions.path.split('=');
				var endLine = 'EndSessionIndex=' + splitedStr[1];
				var visitContext = hasContextBetweenSession(currentPaperVisitLog, splitedStr[1]);
				dumpInfo('visitContext = ' + JSON.stringify(visitContext));

				var hasContainThisPaper = hasVisitThePaper('./visitLog/needCommitWXPaper' + date.pattern("yyyy-MM-dd") + '.txt', visitContext.contextMD5);
				if (hasContainThisPaper) {
					dumpInfo("this paper has been visited by custom Index = " + visitContext.contextMD5 + ", so skip this paper");
					visitContext.hasContext = false;
				}


				// saveDataToFileWithAppend('GZHInformation' + date.pattern("yyyy-MM-dd") + '.txt', endLine);
				saveDataToFileWithAppend('visitLog' + date.pattern("yyyy-MM-dd") + '.txt', requestDetail.url);

				if (!visitContext.hasContext) {
					dumpInfo('>>>>>>>>>>>>>>>>>>>>>>>>>>>  END SESSION ' + splitedStr[1] + " <<<<<<<<<<<<<<<<<<<<<<<");
					dumpInfo('    ');
					dumpInfo('    ');
				}

				if (visitContext.hasContext) {
					var returnData = 'findKeyWord||' + visitContext.contextMD5 + "||" + visitContext.keyword
					return {
						response: {
							statusCode: 200,
							header: {
								'content-type': 'text/html'
							},
							body: returnData
						}
					};
				} else {
					return {
						response: {
							statusCode: 200,
							header: {
								'content-type': 'text/html'
							},
							body: 'notFindKeyWord'
						}
					};
				}
			} else if (requestDetail.requestOptions.path.indexOf('wxIndex') != -1) {
				var splitedStr = requestDetail.requestOptions.path.split('?');
				var date = new Date();
				splitedStr = splitedStr[1].split('&');
				var wxIndex = splitedStr[0].split('=')[1];
				var customIndex = splitedStr[1].split('=')[1];
				dumpInfo('微信Index = ' + wxIndex + ", 自生成索引 = " + customIndex);
				saveDataToFileWithAppend('visitLog' + date.pattern("yyyy-MM-dd") + '.txt', requestDetail.url);

				//save commit log object
				var visitLog = getLastMatchPaperContext(currentPaperVisitLog);
				saveCommitObjList('./visitLog/needCommitWXPaper' + date.pattern("yyyy-MM-dd") + '.txt', wxIndex, visitLog.keyword, customIndex);

				dumpInfo('>>>>>>>>>>>>>>>>>>>>>>>>>>>  END SESSION ' + splitedStr[0] + " <<<<<<<<<<<<<<<<<<<<<<<");
				dumpInfo('    ');
				dumpInfo('    ');

				if (wxIndex == '-') {
					return {
						response: {
							statusCode: 200,
							header: {
								'content-type': 'text/html'
							},
							body: 'failed'
						}
					};
				} else {
					return {
						response: {
							statusCode: 200,
							header: {
								'content-type': 'text/html'
							},
							body: 'success'
						}
					};
				}
			} else if (requestDetail.requestOptions.path.indexOf('loopFinish') != -1) {
				var date = new Date();
				var splitedStr = requestDetail.requestOptions.path.split('=');
				dumpInfo('finish loop : ' + splitedStr[1]);

				return {
					response: {
						statusCode: 200,
						header: {
							'content-type': 'text/html'
						},
						body: 'OK'
					}
				};
			} else if (requestDetail.requestOptions.path.indexOf('phoneCommit') != -1) {
				var date = new Date();
				var splitedStr = requestDetail.requestOptions.path.split('=');
				var message = handleCommitPhoneRequest('./visitLog/needCommitWXPaper' + date.pattern("yyyy-MM-dd") + '.txt', splitedStr[1]);

				dumpInfo('   ');
				dumpInfo('   ');
				dumpInfo('====================================================');
				dumpInfo('====================================================');
				dumpInfo('=== Phone MAC : ' + splitedStr[1] + ' ====');
				dumpInfo('=== commit message : ' + JSON.stringify(message) + ' ====');
				dumpInfo('====================================================');
				dumpInfo('====================================================');
				dumpInfo('   ');
				dumpInfo('   ');

				return {
					response: {
						statusCode: 200,
						header: {
							'content-type': 'text/html'
						},
						body: JSON.stringify(message)
					}
				};
			}
		}

		return null;
	},


	* beforeSendResponse(requestDetail, responseDetail) {
		var responseBody = responseDetail.response.body.toString(); //转换变量为string
		if (/mp\/profile_ext\?action=urlcheck/i.test(requestDetail.url) ||
			/mp\/profile_ext\?action=home/i.test(requestDetail.url)) { //当链接地址为公众号历史消息页面时(第二种页面形式)
			try {
				var reg = /var msgList = \'(.*?)\';/; //定义历史消息正则匹配规则（和第一种页面形式的正则不同）
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
				var jsonInfo = '{"name":"' + name[1] + '", "des":"' + des[1] + '", "icon":"' + encodeURIComponent(icon[1]) + '"}';
				dumpInfo(ret[1]);
			} catch (e) {
				return null;
			}

		} else if (/mp\/profile_ext\?action=getmsg/i.test(requestDetail.url)) { //第二种页面表现形式的向下翻页后的json
			try {
				var json = JSON.parse(responseStr);
				if (json.general_msg_list != []) {
					dumpInfo(json.general_msg_list.toString());
				}
			} catch (e) {
				return null;
			}
			return null;
		} else if (/mp\/getappmsgext/i.test(requestDetail.url)) { //当链接地址为公众号文章阅读量和点赞量时
			return null;
		} else if (/mp\/appmsg_comment/i.test(requestDetail.url)) { //当链接地址为公众号文章阅读量和点赞量时
			return null;
		} else if (/s\?__biz/i.test(requestDetail.url) || /mp\/rumor/i.test(requestDetail.url)) { //当链接地址为公众号文章时（rumor这个地址是公众号文章被辟谣了）
			var util = require("util")
			var newResponse = Object.assign({}, responseDetail.response);
			try {
				//这里采用同步请求的方式，get请求完了之后就进入 callback()
				//nodejs 中的 http.get 方法是异步请求的，所以，http.get还没有请求完 就走到callback 方法，urllib-sync 同步请求的库 解决了
				// var request = require('urllib-sync').request;
				// var res = request(request_url + 'getWxPost.php');
				// newResponse.body += res.data.toString();
				var chineseContextRe = /[^\u4E00-\u9FA5]/g;
				var body = responseDetail.response.body.toString();
				var dumpStr = body.replace(chineseContextRe, '');
				dumpInfo(dumpStr);
				var data = keyWordRuleCheck(dumpStr);

				var util = require('util');
				if (Object.keys(data).length > 0) {
					md5 = require('js-md5');
					// var temp = '发布时间: %s, 公众号: [[%s]] 的文章 <<%s>> 找到了关键字: %s :)';
					var log = new VisitLogClass();
					log.publishTime = getMsgPublishTime(body);
					log.name = getName(body);
					log.title = getMsgTitle(body);
					log.keyword = data['keyword'];
					var curTime = new Date();
					log.searchTime = curTime.pattern("yyyy-MM-dd:hh-mm");
					log.searchIndex = md5(log.publishTime + log.name + log.title);
					log.url = requestDetail.url;

					//save into file GZHInformation.txt
					var date = new Date();
					var dateStr = date.pattern("yyyy-MM-dd");
					if (cmpTime(dateStr, getMsgPublishTime(body)) < 3) {
						saveDataToFile(currentPaperVisitLog, JSON.stringify(log));
					} else {
						log.title = log.title + '   , ((此条公众号信息已经超过3天有效期))'
						saveDataToFile(currentPaperVisitLog, JSON.stringify(new VisitLogClass()));
					}
					// saveDataToFileWithAppend('visitLog' + date.pattern("yyyy-MM-dd") + '.txt', JSON.stringify(log));
					dumpInfo('');
					dumpInfo('');
					dumpInfo(JSON.stringify(log));
					dumpInfo('');
					dumpInfo('');
				} else {
					var temp = '发布时间: %s, 公众号: [[%s]] 的文章 <<%s>> 没有找到关键字:(';
					// dumpInfo('');
					// dumpInfo('');
					// dumpInfo(util.format(temp, getMsgPublishTime(body), getName(body), getMsgTitle(body)));
					// dumpInfo('');
					// dumpInfo('');
					var date = new Date();
					var dateStr = date.pattern("yyyy-MM-dd");
					var logStr = util.format(temp, getMsgPublishTime(body), getName(body), getMsgTitle(body)) + ', URL : ' + requestDetail.url;
					if (cmpTime(dateStr, getMsgPublishTime(body)) < 3) {
						//Do nothing
					} else {
						logStr = logStr + '   , ((此条公众号信息已经超过3天有效期))'
					}
					dumpInfo('');
					dumpInfo('');
					dumpInfo(logStr);
					dumpInfo('');
					dumpInfo('');
					saveDataToFile(currentPaperVisitLog, JSON.stringify(new VisitLogClass()));
				}

				return {
					response: newResponse
				};
			} catch (e) {
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

function keyWordRuleCheck(str) {
	var fs = require('fs');
	var keyWordArray = loadKeyWord();
	var find = false;
	var retData = {};
	var findKey = [];
	var commitFile = [];
	for (key in keyWordArray) {
		if (str.indexOf(keyWordArray[key]) != -1) {
			find = true;
		}
	}

	if (find) {
		var contentText = fs.readFileSync('config/sendKeyMap-log.txt', 'utf-8');
		var keyFileMap = JSON.parse(contentText);
		for (var secondKey in keyFileMap) {
			if (str.indexOf(secondKey) != -1) {
				findKey.push(secondKey);
				if (commitFile.indexOf(keyFileMap[secondKey]) == -1) {
					commitFile.push(keyFileMap[secondKey]);
				}
			}
		}
	}

	if (findKey.length > 0 && commitFile.length > 0) {
		retData['keyword'] = findKey;
		retData['commit'] = commitFile;
	}

	dumpInfo("find key word file : " + JSON.stringify(retData));

	return retData;
}

function VisitLogClass() {
	this.publishTime = '';
	this.name = '';
	this.title = '';
	this.keyword = [];
	this.url = '';
	this.searchTime = '';
	this.searchIndex = '';
}

function VisitContext() {
	this.hasContext = false;
	this.contextMD5 = '';
	this.keyword = [];
}

function CommitLog() {
	this.wxIndex = '';
	this.customIndex = '';
	this.commitPhoneMac = [];
	this.keyword = [];
	this.commit = [];
}

function CommitObjectList() {
	this.listLength = 0;
	this.logList = [];
}

function CommitPhoneMessage() {
	this.wxIndex = '';
	this.message = '';
	this.keyword = [];
	this.noResource = true;
}

function hasVisitThePaper(filename, customIndex) {
	if (customIndex == '') {
		return false;
	}

	var fs = require('fs');
	var commitObjList = new CommitObjectList();
	var dataSync = JSON.stringify(new CommitObjectList());
	try {
		fs.statSync(filename);
		dataSync = fs.readFileSync(filename, "utf8");
	} catch (e) {
		console.log(e);
	}

	commitObjList = JSON.parse(dataSync);
	for (var index in commitObjList.logList) {
		if (customIndex == commitObjList.logList[index].customIndex) {
			return true;
		}
	}

	return false;
}

function saveCommitObjList(filename, wxIndex, keyword, customIndex) {
	var fs = require('fs');

	var commitObjList = new CommitObjectList();
	var dataSync = JSON.stringify(new CommitObjectList());
	try {
		fs.statSync(filename);
		dataSync = fs.readFileSync(filename, "utf8");
		fs.unlinkSync(filename);
	} catch (e) {
		console.log(e);
	}

	var commitFile = [];
	var contentText = fs.readFileSync('config/sendKeyMap-log.txt', 'utf-8');
	var keyFileMap = JSON.parse(contentText);
	// dumpInfo('[[saveCommitObjList]] keyFileMap = ' + JSON.stringify(keyFileMap));
	for (var keyIndex in keyword) {
		if (keyFileMap[keyword[keyIndex]] != null) {
			if (commitFile.indexOf(keyFileMap[keyword[keyIndex]]) == -1) {
				commitFile.push(keyFileMap[keyword[keyIndex]]);
			}
		}
	}
	dumpInfo('[[saveCommitObjList]] commitFile = ' + JSON.stringify(commitFile));

	commitObjList = JSON.parse(dataSync);
	var hasInList = false;
	for (var index in commitObjList.logList) {
		if (commitObjList.logList[index].wxIndex == wxIndex) {
			hasInList = true;
			break;
		}
	}
	if (!hasInList) {
		var commitLog = new CommitLog();
		commitLog.wxIndex = wxIndex;
		commitLog.keyword = keyword;
		commitLog.customIndex = customIndex;
		commitLog.commit = commitFile;
		commitObjList.logList.push(commitLog);
		commitObjList.listLength = commitObjList.logList.length;
	}

	var options = {
		encoding: 'utf8',
		flag: 'a'
	};

	// dumpInfo('[[saveCommitObjList]] keyword = ' + JSON.stringify(keyword));
	// dumpInfo('[[saveCommitObjList]] commitObjList = ' + JSON.stringify(commitObjList));

	fs.writeFileSync(filename, JSON.stringify(commitObjList, 2, 2) + '\n', options);
}

function handleCommitPhoneRequest(filename, phoneMac) {
	if (phoneMac == '') {
		return new CommitPhoneMessage();
	}

	var fs = require('fs');

	var commitObjList = new CommitObjectList();
	var dataSync = JSON.stringify(new CommitObjectList());
	try {
		fs.statSync(filename);
		dataSync = fs.readFileSync(filename, "utf8");
	} catch (e) {
		console.log(e);
	}

	commitObjList = JSON.parse(dataSync);
	for (var index in commitObjList.logList) {
		var hasCommit = false;
		var phoneMacList = commitObjList.logList[index].commitPhoneMac;
		for (var macIndex in phoneMacList) {
			if (phoneMacList[macIndex] == phoneMac) {
				hasCommit = true;
			}
		}
		if (!hasCommit) {
			commitObjList.logList[index].commitPhoneMac.push(phoneMac);
			var message = new CommitPhoneMessage();
			message.wxIndex = commitObjList.logList[index].wxIndex;
			message.keyword = commitObjList.logList[index].keyword;
			message.noResource = false;
			if (commitObjList.logList[index].commit.length > 0) {
				var messageArray = loadCommitToArray(commitObjList.logList[index].commit);
				if (messageArray.length > 0) {
					message.message = messageArray[(commitObjList.logList[index].commitPhoneMac.length - 1) % messageArray.length];
				} else {
					message.message = '';
				}
			}

			dumpInfo('更新评论日志存储 for : ' + phoneMac);
			var log = JSON.stringify(commitObjList, 2, 2);
			fs.unlinkSync(filename);
			var options = {
				encoding: 'utf8',
				flag: 'a'
			};
			fs.writeFileSync(filename, log + '\n', options);

			dumpInfo("Phone : " + phoneMac + ", 将会评论微信文章: " + message.wxIndex + ', 评论内容:' + message.message);
			return message;
		}
	}

	return new CommitPhoneMessage();
}

function loadCommitToArray(commitFileList) {
	var fs = require('fs');
	var retCommitArray = [];
	for (var i in commitFileList) {
		var data = [];
		var filename = './config/' + commitFileList[i];
		try {
			fs.statSync(filename);
			data = fs.readFileSync(filename, "utf8");
		} catch (e) {
			console.log(e);
		}

		var commitItems = JSON.parse(data);
		for (var j in commitItems) {
			retCommitArray.push(commitItems[j]);
		}
	}

	return retCommitArray;
}

function loadKeyWord() {
	var filename = './config/keyword.txt';
	const LineByLine = require('./readlinesyn');
	var liner = new LineByLine();

	liner.open(filename);
	var theline = '';
	while (!liner._EOF) {
		theline += liner.next();
	}

	liner.close();

	return theline.split(',');
}

function cmpTime(time1, time2) {
	if (time1 == null || time2 == null) {
		return 2;
	}

	var data1 = time1.split('-');
	var data2 = time2.split('-');

	console.log(data1, '    ', data2);
	return (parseInt(data1[0]) - parseInt(data2[0])) * 365 + (parseInt(data1[1]) - parseInt(data2[1])) * 30 + (parseInt(data1[2]) - parseInt(data2[2]));
};

function getLastMatchPaperContext(filename) {
	var fs = require('fs');
	var dataSync = fs.readFileSync(filename, "utf8");
	var visitLog = JSON.parse(dataSync);

	return visitLog;
}

function hasContextBetweenSession(filename, sessionIndex) {
	var fs = require('fs');
	var visitContext = new VisitContext();
	visitContext.hasContext = false;
	var dataSync = fs.readFileSync(filename, "utf8");
	var visitLog = JSON.parse(dataSync);
	if (visitLog.searchIndex != '') {
		visitContext.hasContext = true;
		visitContext.contextMD5 = visitLog.searchIndex;
		visitContext.keyword = '文章<<' + visitLog.title + '>>找到关键字:' + visitLog.keyword;
	}
	console.log('>>>>> VisitContext = ' + JSON.stringify(visitContext));

	return visitContext;
}

function saveDataToFileWithAppend(filename, str) {
	// var fs = require("fs");
	// mkdir('./', 'visitLog');
	// fs.appendFile('./visitLog/' + filename, str + '\n', 'utf8', function(err) {
	// 	if (err) {
	// 		console.log(err);
	// 	}
	// });
	logger.info(str);
};

function saveDataToFile(filename, str) {
	var fs = require("fs");
	try {
		fs.statSync(filename);
		fs.unlinkSync(filename);
	} catch (e) {
		console.log(e);
	}
	var options = {
		encoding: 'utf8',
		flag: 'a'
	};
	fs.writeFileSync(filename, str + '\n', options);
}

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
	logger.info(str);
};


function mkdir(dirpath, dirname) {
	var fs = require('fs');
	var path = require('path');
	//判断是否是第一次调用  
	if (typeof dirname === "undefined") {
		if (fs.existsSync(dirpath)) {
			return;
		} else {
			mkdir(dirpath, path.dirname(dirpath));
		}
	} else {
		//判断第二个参数是否正常，避免调用时传入错误参数  
		if (dirname !== path.dirname(dirpath)) {
			mkdir(dirpath);
			return;
		}
		if (fs.existsSync(dirname)) {
			fs.mkdirSync(dirpath)
		} else {
			mkdir(dirname, path.dirname(dirname));
			fs.mkdirSync(dirpath);
		}
	}
};



Date.prototype.pattern = function(fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份         
		"d+": this.getDate(), //日         
		"h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时         
		"H+": this.getHours(), //小时         
		"m+": this.getMinutes(), //分         
		"s+": this.getSeconds(), //秒         
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度         
		"S": this.getMilliseconds() //毫秒         
	};
	var week = {
		"0": "/u65e5",
		"1": "/u4e00",
		"2": "/u4e8c",
		"3": "/u4e09",
		"4": "/u56db",
		"5": "/u4e94",
		"6": "/u516d"
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	if (/(E+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
};

//将json发送到服务器，str为json内容，url为历史消息页面地址，path是接收程序的路径和文件名
function HttpPost(str, url, path) {
	var http = require('http');
	var data = {
		// str: encodeURIComponent(str),
		// url: encodeURIComponent(url)
		str: str,
		url: url
	};
	var content = require('querystring').stringify(data);

	var options = {
		method: "POST",
		host: "127.0.0.1", //注意没有http://，这是服务器的域名。
		port: 8008,
		path: "/" + path, //接收程序的路径和文件名
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			"Content-Length": content.length
		}
	};
	// console.log(content);
	console.log("++++++++++++++++++");
	console.log(options);
	var req = http.request(options, function(res) {
		console.log('STATUS:' + res.statusCode);
		//res.setEncoding('utf8');
		res.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	//加入post数据
	req.write(content);

	req.end();
};


//将json发送到服务器，str为json内容，url为历史消息页面地址，path是接收程序的路径和文件名
function HttpPost(str, url, path) {
	var http = require('http');
	var data = {
		// str: encodeURIComponent(str),
		// url: encodeURIComponent(url)
		str: str,
		url: url
	};
	var content = require('querystring').stringify(data);

	var options = {
		method: "POST",
		host: "127.0.0.1", //注意没有http://，这是服务器的域名。
		port: 8008,
		path: "/" + path, //接收程序的路径和文件名
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			"Content-Length": content.length
		}
	};
	// console.log(content);
	console.log("++++++++++++++++++");
	console.log(options);
	var req = http.request(options, function(res) {
		console.log('STATUS:' + res.statusCode);
		//res.setEncoding('utf8');
		res.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	//加入post数据
	req.write(content);

	req.end();
}