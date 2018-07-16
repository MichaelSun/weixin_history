var VisitPaperFile = './visitPaperData.txt';
var VisitPaperRAWData = './visitPaperRawData.txt';
var WXPaperURLPrefix = 'http://mp.weixin.qq.com/s/';


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

function VisitPaperClass() {
	var count = 0;
	var visitSuccess = 0;
	var unVisitArray = [];
	var visitSuccessArray = [];
	var visitFailedArray = [];
}

function visitDataToJsonFile(rawDataFile, outFile) {
	var data = readFileToString(rawDataFile);
	if (data == '' || data == null) {
		console.log('原始文件没有数据，直接退出');
		return;
	}
	
	var dataSplited = data.replace(/[\r\n]/g, '').split(',');
	//for (var index in dataSplited) {
	//	dataSplited[index] = dataSplited[index].replace(/\r\n/g, '');
	//}

	//log 
	var saveStr = JSON.stringify(dataSplited, 2, 2);
	console.log(saveStr);

	var visitPaperClass = new VisitPaperClass();
	visitPaperClass.count = dataSplited.length;
	visitPaperClass.visitSuccess = 0;
	visitPaperClass.unVisitArray = dataSplited;
	visitPaperClass.visitSuccessArray = [];
	visitPaperClass.visitFailedArray = [];

	saveDataToFile(outFile, JSON.stringify(visitPaperClass, 2, 2));

	console.log('  ');
	console.log('  ');
	console.log('>>>>>>>>>> 解析需要访问的微信文章到: ' +  outFile + ', 总计: ' + visitPaperClass.count + '篇文章 <<<<<<<<<');
	console.log('  ');
	console.log('  ');
}

//to_json(workbook);
visitDataToJsonFile(VisitPaperRAWData, VisitPaperFile);