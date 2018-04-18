var XLSX = require("xlsx")
const workbook = XLSX.readFile('data.xlsx');


function to_json(workbook) {
	var result = {};
	// 获取 Excel 中所有表名
	var sheetNames = workbook.SheetNames;
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

	var saveStr = JSON.stringify(contentMap, 2, 2);
	console.log(saveStr);

	saveDataToFile(filename, saveStr);

	//split json to files
	var sendKeyMap = {};
	var MD5 = require('js-md5');
	for (var key in contentMap) {
		var fileNameArray = key.split('/');
		var fileMd5Name = MD5(key) + '-log.txt';
		saveDataToFile('./config/' + fileMd5Name, JSON.stringify(contentMap[key], 2, 2));
		for (var i in fileNameArray) {
			sendKeyMap[fileNameArray[i]] = fileMd5Name;
		}
	}

	saveDataToFile('./config/sendKeyMap-log.txt', JSON.stringify(sendKeyMap, 2, 2));

	console.log('  ');
	console.log('  ');
	console.log('>>>>>>>>>> 分文件保存关键字成功 <<<<<<<<<');
	console.log('  ');
	console.log('  ');
}

//to_json(workbook);
excelToJsonFile(workbook, './config/KeyMapJson-log.txt');
