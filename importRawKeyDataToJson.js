var VisitPaperFile = './visitPaperData.txt';
var VisitPaperRAWData = './visitPaperRawData.txt';
var VisitPaperCustomForceFile = "./paper_visit/customForceVisitPaper.txt";
var WXPaperURLPrefix = 'http://mp.weixin.qq.com/s/';


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

function readFileToString(fileFullPath) {
	var fs = require('fs');
	var retData = "";
	try {
		fs.statSync(fileFullPath);
		retData = fs.readFileSync(fileFullPath, "utf8");
	} catch (e) {
		console.log(e);
	}

	return retData;
}

function CommitLog() {
	this.wxIndex = '';
	this.customIndex = '';
	this.commitPhoneMac = [];
	this.keyword = [];
	this.commit = [];
	this.paperTitle = '';
	this.paperDiscoverTime = '';
	this.paperDetailUrl = '';
	this.commentPhoneDetailLogList = [];
}

function CommitObjectList() {
	this.listLength = 0;
	this.logList = [];
}

function VisitPaperClass() {
	var count = 0;
	var visitSuccess = 0;
	var unVisitArray = [];
	var visitSuccessArray = [];
	var visitFailedArray = [];
}

function CustomVisitPaperObjClass() {
	var customURL = "";
	var customContent = "";
}

function CustomVisitPaperImportClass() {
	var commentSearchPaper = [];
	var customVisitPaper = [];
}

function searchKeyWordBaseCustomContent(mainContent) {
	var fs = require('fs');
	var findKey = [];
	var commitFile = [];
	var retData = {};

	var contentText = fs.readFileSync('config/sendKeyMap-log.txt', 'utf-8');
	var keyFileMap = JSON.parse(contentText);
	for (var keyword in keyFileMap) {
		if (mainContent.indexOf(keyword) != -1) {
			findKey.push(keyword);
			if (commitFile.indexOf(keyFileMap[keyword]) == -1) {
				commitFile.push(keyFileMap[keyword]);
			}
		}
	}

	if (findKey.length > 0 && commitFile.length > 0) {
		retData['keyword'] = findKey;
		retData['commit'] = commitFile;
	} else {
		retData['keyword'] = ['万金油'];
		retData['commit'] = ['d7b41ce4d57a99a3ab8932cb1f4dc862-log.txt'];
	}

	console.log("基于内容 : " + mainContent + "\n找到关键字 : " + JSON.stringify(retData) + "\n");

	return retData;
}

function getWXIndex(wexinURL) {
	var retIndex = '';
	if (wexinURL.indexOf('s/') != -1) {
		retIndex = wexinURL.split('s/')[1];
	}

	return retIndex;
}

function saveCommitObjList(filename, wxIndex, keyword, customIndex, paperTitle) {
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
	//console.log('[[saveCommitObjList]] commitFile = ' + JSON.stringify(commitFile));

	commitObjList = JSON.parse(dataSync);
	var hasInList = false;
	for (var index in commitObjList.logList) {
		if (commitObjList.logList[index].wxIndex == wxIndex) {
			hasInList = true;
			break;
		}
	}
	if (!hasInList) {
		var date = new Date();
		var fileDate = date.pattern("yyyy-MM-dd HH:mm:ss");
		var commitLog = new CommitLog();
		commitLog.wxIndex = wxIndex;
		commitLog.keyword = keyword;
		commitLog.customIndex = customIndex;
		commitLog.commit = commitFile;
		commitLog.paperTitle = paperTitle;
		commitLog.paperDiscoverTime = fileDate;
		commitLog.paperDetailUrl = 'https://mp.weixin.qq.com/s/' + wxIndex;

		commitObjList.logList.push(commitLog);
		commitObjList.listLength = commitObjList.logList.length;
	}

	var options = {
		encoding: 'utf8',
		flag: 'a'
	};

	fs.writeFileSync(filename, JSON.stringify(commitObjList, 2, 2) + '\n', options);
}

function makeCustomVisitPaperLog(customVisitPaperObjList) {
	var importCount = 0;
	for (var index in customVisitPaperObjList) {
		var customVisitPaperObj = customVisitPaperObjList[index];
		if (customVisitPaperObj.customContent == '' || customVisitPaperObj.customContent == null) {
			console.log('这个需要访问的URL没有设置内容，暂时不支持访问，需要访问的URL=' + customVisitPaperObj.customURL);
		} else {
			console.log('开始处理 第[[' + index + ']]条 自定义内容, URL=' + customVisitPaperObj.customURL + ", 文本内容=" + customVisitPaperObj.customContent);
			var keywordData = searchKeyWordBaseCustomContent(customVisitPaperObj.customContent);
			if (Object.keys(keywordData).length > 0) {
				md5 = require('js-md5');
				var wxIndex = getWXIndex(customVisitPaperObj.customURL);
				if (wxIndex == '') {
					console.log('解析微信Index错误，忽略此条URL，需要访问的URL=' + customVisitPaperObj.customURL);
				} else {
					saveCommitObjList(VisitPaperCustomForceFile, wxIndex, keywordData['keyword'], md5(customVisitPaperObj.customURL), '');
					importCount = importCount + 1;
				}
			} else {
				console.log('解析Keyword失败，给定的内容没有找到关键字，需要解析的文本内容 = ' + customVisitPaperObj.customContent);
			}
		}
	}

	return importCount;
}

function visitDataToJsonFile(rawDataFile, outFile) {
	var importClass = new CustomVisitPaperImportClass();
	var dataSync = JSON.stringify(new CustomVisitPaperImportClass());

	var dataSync = readFileToString(rawDataFile);
	if (dataSync == '' || dataSync == null) {
		console.log('原始文件没有数据，直接退出');
		return;
	}
	importClass = JSON.parse(dataSync);
	if (importClass == null) {
		console.log('原始文件解析成JSON对象错误，直接退出');
	}

	//var dataSplited = data.replace(/[\r\n]/g, '').split(',');
	//for (var index in dataSplited) {
	//	dataSplited[index] = dataSplited[index].replace(/\r\n/g, '');
	//}

	//log 
	//var saveStr = JSON.stringify(dataSplited, 2, 2);
	//console.log(saveStr);

	var visitPaperClass = new VisitPaperClass();
	visitPaperClass.count = importClass.commentSearchPaper.length;
	visitPaperClass.visitSuccess = 0;
	visitPaperClass.unVisitArray = importClass.commentSearchPaper;
	visitPaperClass.visitSuccessArray = [];
	visitPaperClass.visitFailedArray = [];

	saveDataToFile(outFile, JSON.stringify(visitPaperClass, 2, 2));

	var logStr = JSON.stringify(importClass.commentSearchPaper, 2, 2);
	console.log("导入关键字搜索文章如下 : \n" + logStr);
	console.log('  ');
	console.log('  ');

	var importCount = 0;
	if (importClass.customVisitPaper.length > 0) {
		console.log('>>>>>>>> 开始自定义微信文章扫描 <<<<<<<<');
		console.log('  ');	
		importCount = makeCustomVisitPaperLog(importClass.customVisitPaper);
		console.log('<<<<<<<< 完成自定义微信文章扫描 >>>>>>>>');		
	}

	console.log('  ');
	console.log('  ');
	console.log('>>>>>>>>>> 需要进行关键字搜索的微信文章，已经存储到: ' +  outFile + ', 总计: ' + visitPaperClass.count + '篇文章 <<<<<<<<<');
	if (importCount > 0) {
		console.log('>>>>>>>>>> 需要进行自定义微信扫码评论的文章，已经存储到: ' +  VisitPaperCustomForceFile + ', 总计: ' + importCount+ '篇文章 <<<<<<<<<');
	}
	console.log('  ');
	console.log('  ');
}

//to_json(workbook);
visitDataToJsonFile(VisitPaperRAWData, VisitPaperFile);

