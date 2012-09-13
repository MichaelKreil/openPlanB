var fs = require('fs');
var gtfs_utils = require('./gtfs_utils.js');




exports.makeGTFS = function (data, outputFolder) {
	//Helper functions
	var convertTime = function(time) {
		return Math.floor(time/60) + ":" + ((time%60 > 9) ? time%60 : "0" + time%60) + ":00";
	}
	var getProperty = function(code) {
		return code + ' ' + propertyDescription[code].text;
	}
	var trainsHeader = data.trainsHeader;
	var trains = data.trains;
	var stations = data.stations;
	var trainRoutes = data.trainRoutes;
	var trainTypes = data.trainTypes;
	var specialLines = data.specialLines;
	var trainAttributesTrainNumbers = data.trainAttributesTrainNumbers;
	var trainAttributesProperties = data.trainAttributesProperties;
	var trainAttributesDaysValid = data.trainAttributesDaysValid;
	var trainAttributesBorderCrossings = data.trainAttributesBorderCrossings;
	var trainOperatorsList1 = data.trainOperatorsList1;
	var trainOperatorsList2 = data.trainOperatorsList2;
	var trainOperatorsList3 = data.trainOperatorsList3;
	var daysValidBitsets = data.daysValidBitsets;
	var borderStations = data.borderStations;
	var schedule = data.schedule;


	var trips = [];
	trips.push([
		'route_id',
		'service_id',
		'trip_id'
	]);
	var stopTimes = [];
	stopTimes.push([
		'trip_id',
		'arrival_time',
		'departure_time',
		'stop_id',
		'stop_sequence'
	]);
	var calendar = [];
	calendar.push([
		'service_id',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
		'sunday',
		'start_date',
		'end_date'
	]);
	var frequencies = [];
	frequencies.push([
		'trip_id',
		'start_time',
		'end_time',
		'headway_secs',
		'exact_times'
	]);

	var scheduleForTrains = [];
	// Create lookup table scheduleForTrains
	// scheduleForTrains[train_id][station_id:{arr,dep}]
	for (var i = 0; i < schedule.length; i++) {
		scheduleForTrains[schedule[i].train_id] = scheduleForTrains[schedule[i].train_id] || [];
		scheduleForTrains[schedule[i].train_id][schedule[i].station_id] = schedule[i];
	}


	//Go trough all trains from PlanZUG
	//Reuse their ID as service_id in GTFS

	for (var t = 0; t < trains.length; ++t) {
		var train = trains[t];
		var stops = trainRoutes[ train.laufId ].stops;

		var trainSchedule = scheduleForTrains[train.id];

		trips.push([train.laufId, train.id, train.id]);

		//Walktrough stops and save all
		for (var s = 0; s < stops.length; ++s){
			var stopID = stops[s];
			stopTimes.push([
				train.id,
				convertTime(trainSchedule[stopID].arr),
				convertTime(trainSchedule[stopID].dep),
				stopID,
				s
			]);
		}

		
		if (train.frequency.iterations > 0) {
			//This train runs more than once
			var startTime = trainSchedule[stops[0]].dep;
			var stopTime = train.frequency.iterations * train.frequency.interval + startTime;
			frequencies.push([
				train.id,
				convertTime(startTime),
				convertTime(stopTime),
				train.frequency.interval*60,
				1
			]);
		}


		//Now save stuff to calendar
		//Why is PlanAtr empty for the VBB?
		calendar.push([train.id,1,1,1,1,1,1,1,20100101, 20131231]);

	}

	gtfs_utils.outputGTFSFile(trips, outputFolder, 'trips');
	gtfs_utils.outputGTFSFile(stopTimes, outputFolder, 'stop_times');
	gtfs_utils.outputGTFSFile(calendar, outputFolder, 'calendar');
	gtfs_utils.outputGTFSFile(frequencies, outputFolder, 'frequencies');
}