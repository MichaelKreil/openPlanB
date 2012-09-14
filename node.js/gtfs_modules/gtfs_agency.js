var fs = require('fs');
var gtfs_utils = require('./gtfs_utils.js');

exports.makeGTFS = function (data, outputFolder) {
	var agencies = data.betr1;

	var list = [];
	list.push([
		'agency_id',
		'agency_name',
		'agency_url',
		'agency_timezone',
		'agency_lang'
	]);
	
	for (var i = 0; i < agencies.length; i++) {
		if ( i === 0 && agencies[i].nameLong === "" ) continue;
		list.push([
			gtfs_utils.formatInteger(i),
			gtfs_utils.formatString(agencies[i].nameLong),
			gtfs_utils.formatString('http://bahn.de'),
			gtfs_utils.formatString('Europe/Berlin'),
			gtfs_utils.formatString('de')
		]);
	}
	
	gtfs_utils.outputGTFSFile(list, outputFolder, 'agency');
};