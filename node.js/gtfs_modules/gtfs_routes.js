var fs = require('fs');
var gtfs_utils = require('./gtfs_utils.js');

exports.makeGTFS = function (data, outputFolder) {
	var line  = data.line;
	var zug   = data.zug;
	var betr2 = data.betr2;
	var betr3 = data.betr3;
	var stations = data.b;
	var routes = data.routes;

	var line2betr = [];
	for (var i = 0; i < zug.length; i++) {
		var key = zug[i].laufId;
		var value = betr3[i].betr2Id;
		value = betr2[value].betr1Id;
		line2betr[key] = value;
	}

	//Save line number (U1, U3, U9 etc) for all routes:
	var linesVsRoutes = [];
	for (var i = 0; i < zug.length; i++) {
		linesVsRoutes[zug[i].laufId] = zug[i].trainNumber;
	}

	//Save transport type (Bus, Tram, Train etc.) for all routes:
	var transportTypeVsRoutes = [];
	for (var i = 0; i < zug.length; i++) {
		transportTypeVsRoutes[zug[i].laufId] = zug[i].trainType;
	}

	//Extract line names 
	var lineNames = [];	
	for (var i = 0; i < line.length; i++) {
		lineNames[line[i].lineId] = line[i].lineName;
	}

	var list = [];
	list.push([
		'route_id',
		'agency_id',
		'route_short_name',
		'route_long_name',
		'route_type'
	]);


	for (routeID in linesVsRoutes) {
		var entry = [];

		// route_id
		entry.push(gtfs_utils.formatInteger(parseInt(routeID,10)));

		// agency_id
		entry.push(gtfs_utils.formatInteger(line2betr[routeID]));

		// route_short_name
		entry.push(gtfs_utils.formatString(lineNames[linesVsRoutes[routeID]] || "UnknownName"));

		// route_long_name
		var lineLength = routes[routeID].stops.length;
		var lineFrom = routes[routeID].stops[0];
		var lineTo = routes[routeID].stops[lineLength-1];
		lineFrom = stations[lineFrom].name;
		lineTo = stations[lineTo].name;

		entry.push(gtfs_utils.formatString(lineFrom + " -> " + lineTo));
		
		// TODO: UNCOMPLETE
		// route_type
		// 0 - Tram, Streetcar, Light rail. Any light rail or street level system within a metropolitan area.
		// 1 - Subway, Metro. Any underground rail system within a metropolitan area.
		// 2 - Rail. Used for intercity or long-distance travel.
		// 3 - Bus. Used for short- and long-distance bus routes.
		// 4 - Ferry. Used for short- and long-distance boat service.

		var routeType;
		switch(transportTypeVsRoutes[routeID]) {
			case 85:
				routeType = 2;
			case 87:
				routeType = 1;
			case 88:
				routeType = 0;
			case 89:
				routeType = 4;
			case 90:
				routeType = 2;
			default:
				//Bus
				routeType = 3;
		}
		entry.push(gtfs_utils.formatInteger(routeType));

		list.push(entry);
	}

	gtfs_utils.outputGTFSFile(list, outputFolder, 'routes');
}