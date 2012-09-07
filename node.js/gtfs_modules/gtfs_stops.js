var fs = require('fs');
var gtfs_utils = require('./gtfs_utils.js');

exports.makeGTFS = function (data, outputFolder) {
	var stations = data.b;
	var geo      = data.kgeo;

	var list = [];
	list.push([
		'stop_id',
		'stop_name',
		'stop_lat',
		'stop_lon',
		'stop_timezone'
	]);
	
	for (var i = 0; i < stations.length; i++) {
		list.push([
			gtfs_utils.formatInteger(i),
			gtfs_utils.formatString(stations[i].name),
			gtfs_utils.formatNumber(geo[i].lat, 6),
			gtfs_utils.formatNumber(geo[i].lon, 6),
			gtfs_utils.formatString('DE')
		]);
	}
	
	gtfs_utils.outputGTFSFile(list, outputFolder, 'stops');
}