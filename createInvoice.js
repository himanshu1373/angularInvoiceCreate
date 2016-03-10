var fs = require('fs');
var wrench = require('wrench');
var util = require('util');
var wkhtmltopdf = require('wkhtmltopdf');

var args = process.argv.slice(2);
var nodeScriptDirPath = process.argv[1].replace('createInvoice.js', '');
var invoiceObj;

/*
 * No arguments parsed through, I don't know what to do
*/
if (!args.length) {
	console.log('It looks as though you haven\'t parsed anything through to the script. Try running the script again with --help to get some tips.');
	process.exit(1);
}

/*
 * Check to see if the user has asked for help
*/
var exampleJsonSchema = {
	'purchaseOrderId': 1234,
	'invoiceNumber': 1,
	'invoiceDate': '01/01/16',
	'invoiceDescription': 'work I did for this company',
	'nameAndEmail': 'John Doe, john.doe@somewhere.com',
	'workBreakdown': [
		{
			'date': '01/01/16',	
			'timeWorkedInHours': '8',	
			'dayRate': '600'	
		}
	]
}
if (args[0] == '--help' || args[0] == '-h') {
	console.log('The createInvoice script requires that you pass through 2 parametes. The first is the invoice data and the second is the file path that you would like to save the output to (remember this outputs pdf files). There are 2 ways that you can pass through the content to the script. \nThe first is to pass the path to a json file with the following schema:\n\n' + JSON.stringify(exampleJsonSchema, null, 4) + '\n\nlike this: node createInvoice.js ~/Desktop/invoiceData.json\n\n\nThe second way is to pass through the same json schema as a string like this:\n\nnode createInvoice.js ' + JSON.stringify(exampleJsonSchema));
	process.exit(1);
}

/*
 * check to see if the output file pth has been provided as the second argument
*/
if (!args[1]) {
	console.log('ERROR: I couldn\'t find the output file path, please check that you provided it as the second parameter.');
	process.exit(1);
}


/*
 * Lets check if the argument parsed through is a path to a json file
*/
if (args[0].indexOf('.json') > -1) {
	fs.readFile(args[0], 'utf8', function(err, data) {
		if (err) {
			console.log('ERROR: I couldn\'t load the json file you passed through please check and try again.');
			process.exit(1);
		}
		try {
			invoiceObj = JSON.parse(data);
			processInvoiceData();
		}
		catch(error) {
			console.log('error = ', error);
			console.log('ERROR: I couldn\'t read the json file that you passed through please check it for errors and try again.');
			process.exit(1);
		}
	});
}

/*
 * if we've reached this far then the user should have passed through a json string as the first argument
*/

else if (args[0].indexOf('.json') == -1) {
	try {
		invoiceObj = JSON.parse(args[0]);
		processInvoiceData();
	}
	catch(error) {
		console.log('ERROR: I couldn\'t read the json string that you passed through please check it for errors and try again.');
		process.exit(1);
	}
}

function processInvoiceData() {
	copyTempWorkingFiles();
	modifyTmpModelWithNewData();
	takePdfSnapshot();
}

function copyTempWorkingFiles () {
	fs.mkdirSync(nodeScriptDirPath + 'invoiceWorkingDirTMP');

	wrench.copyDirSyncRecursive(nodeScriptDirPath + 'ngApp', nodeScriptDirPath + 'invoiceWorkingDirTMP/ngApp', {
	    forceDelete: true
	});

	fs.createReadStream(nodeScriptDirPath + 'invoiceAngular.html').pipe(fs.createWriteStream(nodeScriptDirPath + 'invoiceWorkingDirTMP/invoiceAngular.html'));
}

function modifyTmpModelWithNewData () {
	//load the invoiceApp.js file and modify the $scope.model object
	var invoiceAppJsFileString = fs.readFileSync(nodeScriptDirPath + 'invoiceWorkingDirTMP/ngApp/scripts/invoiceApp.js', 'utf8');

	//look for the start and end index in the file string of the model object
	var modelStartIndex = invoiceAppJsFileString.indexOf('$scope.model = {') + 15;
	var modelEndIndex = invoiceAppJsFileString.indexOf('};', modelStartIndex) + 1;
	
	//store the model as a string
	var modelStr = invoiceAppJsFileString.substring(modelStartIndex, modelEndIndex).replace(/\'/gi, '"');

	//parse the model string
	var modelObj = JSON.parse(modelStr);
	
	//replace all passed properties back into the modelObj
	for (var key in invoiceObj) {
		modelObj[key] = invoiceObj[key];
	}

	//create updated model object string
	var updatedObjStr = JSON.stringify(modelObj);

	//construct updated invoiceAppJsFileString
	var updatedInvoiceAppJsFileString = invoiceAppJsFileString.substring(0, modelStartIndex) + updatedObjStr + invoiceAppJsFileString.substring(modelEndIndex, invoiceAppJsFileString.length);

	//save the invoiceApp.js file
	fs.writeFile(nodeScriptDirPath + 'invoiceWorkingDirTMP/ngApp/scripts/invoiceApp.js', updatedInvoiceAppJsFileString, 'utf8');

}

function takePdfSnapshot () {
	wkhtmltopdf('file://' + nodeScriptDirPath + '/invoiceWorkingDirTMP/invoiceAngular.html', { pageSize: 'A4', 'javascript-delay': 2000 }, function (code, signal) {
			removeTempFiles();
		})
		.pipe(fs.createWriteStream(args[1]));
}

function removeTempFiles () {
	wrench.rmdirSyncRecursive(nodeScriptDirPath + 'invoiceWorkingDirTMP', function(err) {
		console.log('ERROR: looks like there was an error trying to delete the invoiceWorkingDirTMP directory');
		process.exit(1);
	});
}