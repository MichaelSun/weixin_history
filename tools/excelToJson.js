var XLSX = require("xlsx")
const workbook = XLSX.readFile('externalData/data.xlsx');
var visitPaperConfigFile = './runtime/externalPaperVisit/visitPaper_keyword.txt';
var visitPaperConfigMergeFile = './externalData/visitPaper_keyword_merge.txt';
var commentMapKeyFile = './config/sendKeyMap-log.txt';
var composeCommentMapKeyFile = './config/sendComposeKeyMap-log.txt';

function VisitPaperObjClass() {
	this.title = '';
	this.url = '';
	this.content = '';
	this.findLog = [];
	this.keyword = [];
	this.comments = [];
}

function VisitPaperListClass() {
	this.count = 0;
	this.visitPaperInfoList = [];
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

function to_json(workbook) {
	var result = {};
	// 获取 Excel 中所有表名
	workbook.SheetNames.forEach(function(sheetName) {
		var worksheet = workbook.Sheets[sheetName];
		result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
	});
	console.log("打印表信息", JSON.stringify(result, 2, 2));
	// console.log(JSON.stringify(result));
	return result;
}

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

function mergeCurFileToMergeFile() {
	var visitPaperList = new VisitPaperListClass();
	var visitPaperListData = readFileToString(visitPaperConfigMergeFile);
	if (visitPaperListData != null && visitPaperListData != '') {
		visitPaperList = JSON.parse(visitPaperListData);
	}

	var curVisitPaperList = new VisitPaperListClass();
	var curVisitPaperListData = readFileToString(visitPaperConfigFile);
	if (curVisitPaperListData != null && curVisitPaperListData != '') {
		curVisitPaperList = JSON.parse(curVisitPaperListData);
	}

	if (curVisitPaperList.count > 0) {
		visitPaperList.count = visitPaperList.count + curVisitPaperList.count;
		var index = 0;
		while (index < curVisitPaperList.count) {
			visitPaperList.visitPaperInfoList.push(curVisitPaperList.visitPaperInfoList[index]);
			index = index + 1;
		}
	}

	saveDataToFile(visitPaperConfigMergeFile, JSON.stringify(visitPaperList, 2, 2));
}

function splitKeyword(keywordNeedSplited) {
	var ret = keywordNeedSplited.split('/');
	ret = splitedKeywordArrayBySplitedKey(ret, ';');
	ret = splitedKeywordArrayBySplitedKey(ret, '，');
	ret = splitedKeywordArrayBySplitedKey(ret, ',');
	ret = splitedKeywordArrayBySplitedKey(ret, '；');

	//console.log('分割关键字结果，原始关键字 : [[ ' + keywordNeedSplited + ' ]], 分离结果 : ' + JSON.stringify(ret));

	return ret;
}

function splitedKeywordArrayBySplitedKey(arraySplited, splitedKey) {
	var ret = [];
	for (var index in arraySplited) {
		ret = ret.concat(arraySplited[index].split(splitedKey));
	}
	return ret;
}

function excelToJsonFile(workbook, filename) {
	var contentMap = {};
	var result = {};
	var sheetNames = workbook.SheetNames;
	var saveJsonStr = '';
	workbook.SheetNames.forEach(function(sheetName) {
		var worksheet = workbook.Sheets[sheetName];
		result[sheetName] = XLSX.utils.sheet_to_json(worksheet);

		if (result[sheetName] != []) {
			for (var objIndex in result[sheetName]) {
				var obj = result[sheetName][objIndex];
				for (var key in obj) {
					if (contentMap[key] != null) {
						var content = obj[key].replace(/\r\n/g, '');
						contentMap[key].push(content);
					} else {
						var content = obj[key].replace(/\r\n/g, '');
						contentMap[key] = [content];
					}
				}
			}
		}
	});

	//add visitPaper_keyword_merge
	var visitPaperList = new VisitPaperListClass();
	var visitPaperListData = readFileToString(visitPaperConfigMergeFile);
	if (visitPaperListData != null && visitPaperListData != '') {
		visitPaperList = JSON.parse(visitPaperListData);
	}
	var index = 0;
	while (index < visitPaperList.count) {
		var visitPaperObj = visitPaperList.visitPaperInfoList[index];
		if (visitPaperObj.keyword.length > 0 && visitPaperObj.comments.length > 0) {
			for (var keyIndex in visitPaperObj.keyword) {
				var key = visitPaperObj.keyword[keyIndex];
				if (contentMap[key] != null) {
					contentMap[key] = contentMap[key].concat(visitPaperObj.comments);
				} else {
					contentMap[key] = visitPaperObj.comments;
				}
			}
		}
		index = index + 1;
	}

	//add visitPaperConfigFile file content
	visitPaperList = new VisitPaperListClass();
	visitPaperListData = readFileToString(visitPaperConfigFile);
	if (visitPaperListData != null && visitPaperListData != '') {
		visitPaperList = JSON.parse(visitPaperListData);
	}
	index = 0;
	while (index < visitPaperList.count) {
		var visitPaperObj = visitPaperList.visitPaperInfoList[index];
		if (visitPaperObj.keyword.length > 0 && visitPaperObj.comments.length > 0) {
			for (var keyIndex in visitPaperObj.keyword) {
				var key = visitPaperObj.keyword[keyIndex];
				if (contentMap[key] != null) {
					contentMap[key] = contentMap[key].concat(visitPaperObj.comments);
				} else {
					contentMap[key] = visitPaperObj.comments;
				}
			}
		}
		index = index + 1;
	}

	var saveStr = JSON.stringify(contentMap, 2, 2);
	//console.log(saveStr);

	saveDataToFile(filename, saveStr);

	//split json to files
	var count = 0;
	var composeCount = 0;
	var sendKeyMap = {};
	var composeSendKeyMap = {};
	var MD5 = require('js-md5');
	for (var key in contentMap) {
		//var fileNameArray = key.split('/');
		var fileNameArray = splitKeyword(key);
		var fileMd5Name = MD5(key) + '-log.txt';
		saveDataToFile('./config/' + fileMd5Name, JSON.stringify(contentMap[key], 2, 2));
		for (var i in fileNameArray) {
			if (fileNameArray[i].indexOf('-') != -1) {
				composeSendKeyMap[fileNameArray[i]] = fileMd5Name;
				composeCount = composeCount + 1;
			} else {
				sendKeyMap[fileNameArray[i]] = fileMd5Name;
				count = count + 1;
			}
		}
	}

	saveDataToFile(commentMapKeyFile, JSON.stringify(sendKeyMap, 2, 2));
	saveDataToFile(composeCommentMapKeyFile, JSON.stringify(composeSendKeyMap, 2, 2));
	mergeCurFileToMergeFile();

	console.log('  ');
	console.log('  ');
	console.log('>>>>>>>>>> 分文件导入关键字成功, 共导入: [[ ' + count + ' ]] 个关键字到 ' + commentMapKeyFile  + ' 文件 <<<<<<<<<<');
	console.log('>>>>>>>>>> 分文件导入组合关键字成功, 共导入: [[ ' + composeCount + ' ]] 个关键字到 ' + composeCommentMapKeyFile  + ' 文件 <<<<<<<<<<');
	console.log('  ');
	console.log('  ');
}

//to_json(workbook);
excelToJsonFile(workbook, './config/KeyMapJson-log.txt');