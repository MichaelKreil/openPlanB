var fs = require('fs');
var gtfs_utils = require('./gtfs_utils.js');

exports.makeGTFS = function (data, outputFolder) {
	var transfers = data.transfers;

	var list = [];
	list.push([
		'from_stop_id',
		'to_stop_id',
		'transfer_type',
		'min_transfer_time'
	]);
	
	for (var i = 0; i < transfers.length; i++) {
		var from = transfers[i];
		for (var j = 0; j < from.kanten.length; j++) {
			list.push([
				from.bahnhofid,
				from.kanten[j].bahnhofid,
				2,
				from.kanten[j].dauer * 60
			]);
		}
	}
	
	gtfs_utils.outputGTFSFile(list, outputFolder, 'transfers');
}