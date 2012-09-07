var fs = require('fs');
var gtfs_utils = require('./gtfs_utils.js');

exports.makeGTFS = function (data, outputFolder) {
	var line  = data.line;
	var zug   = data.zug;
	var betr2 = data.betr2;
	var betr3 = data.betr3;
	
	var line2betr = [];

	for (var i = 0; i < zug.length; i++) {
		var key = zug[i].lineId;
		var value = betr3[i].betr2Id;
		value = betr2[value].betr1Id;
		line2betr[key] = value;
	}
	
	var list = [];
	list.push([
		'route_id',
		'agency_id',
		'route_short_name',
		'route_long_name',
		'route_type'
	]);
	
	for (var i = 0; i < line.length; i++) {
		var entry = [];
		
		// route_id
		if (i != line[i].lineId) console.error('ERROR lineId is not correct');
		entry.push(gtfs_utils.formatInteger(i));
		
		// agency_id
		entry.push(gtfs_utils.formatString(line2betr[i]));
		
		// route_short_name
		entry.push(gtfs_utils.formatString(line[i].lineName));
		
		// route_long_name
		entry.push(gtfs_utils.formatString(''))
		
		// route_type
		

		list.push(entry);
		
		[
			,
			
			
			
			,
			gtfs_utils.formatNumber(geo[i].lat, 6),
			gtfs_utils.formatNumber(geo[i].lon, 6),
			gtfs_utils.formatString('DE')
		]);
	}
	
	gtfs_utils.outputGTFSFile(list, outputFolder, 'stops');
}