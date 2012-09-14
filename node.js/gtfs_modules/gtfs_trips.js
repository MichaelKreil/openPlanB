var fs = require('fs');
var gtfs_utils = require('./gtfs_utils.js');




exports.makeGTFS = function (data, outputFolder) {
	//Helper functions
	var convertTime = function(time) {
		return Math.floor(time/60) + ":" + ((time%60 > 9) ? time%60 : "0" + time%60) + ":00";
	};
	var getProperty = function(code) {
		return code + ' ' + propertyDescription[code].text;
	};
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
	calendar.push(["everyday",1,1,1,1,1,1,1,20100101, 20131231]);
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
	// scheduleForTrains[train_id][station_id:[{arr,dep}, {arr,dep}]]
	for (var i = 0; i < schedule.length; i++) {
		//First fix times == -1, They aren't valid in GTFS
		schedule[i].arr = (schedule[i].arr == -1) ? schedule[i].dep : schedule[i].arr;
		schedule[i].dep = (schedule[i].dep == -1) ? schedule[i].arr : schedule[i].dep;

		//Now populate lookup
		scheduleForTrains[schedule[i].train_id] = scheduleForTrains[schedule[i].train_id] || [];
		var trainSchedule = scheduleForTrains[schedule[i].train_id];

		//Sometimes a bus visits a station twice
		trainSchedule[schedule[i].station_id] = trainSchedule[schedule[i].station_id] || [];
		trainSchedule[schedule[i].station_id].push(schedule[i]);
	}


	//Go trough all trains from PlanZUG
	//Reuse their ID as service_id in GTFS
	for (var t = 0; t < trains.length; ++t) {
		var lastDeparture = 0;
		var addMinutes = 0;
		var seenStops = {};
		var train = trains[t];
		var stops = trainRoutes[ train.laufId ].stops;

		var trainSchedule = scheduleForTrains[train.id];

		trips.push([train.laufId, "everyday", train.id]);

		//Walktrough stops and save all
		for (var s = 0; s < stops.length; ++s){
			var stopID = stops[s];
			seenStops[stopID] = seenStops[stopID] || 0;

			//A bus might stop at a station twice
			var currentStop = trainSchedule[stopID][seenStops[stopID]];

			//Sometimes you have stuff like this:
			// 26728,13:19:00,13:34:00,2532,0
			// 26728,13:21:00,13:22:00,2436,1
			// It only affects the first stop
			if ( s === 0 && currentStop.dep > trainSchedule[stops[1]][0].arr ) {
				currentStop.dep = currentStop.arr;
			}

			//If a trains runs across midnight,
			//the times should be 24:01 instead of 00:01
			if ( currentStop.dep < lastDeparture ) {
				addMinutes = addMinutes + 1440;
			}

			stopTimes.push([
				train.id,
				convertTime(currentStop.arr + addMinutes),
				convertTime(currentStop.dep + addMinutes),
				stopID,
				s
			]);

			//Add 1 to stopcounter
			seenStops[stopID]++;

			//Update last departure
			lastDeparture = currentStop.dep + addMinutes;
		}
		
		if (train.frequency.iterations > 0) {
			//This train runs more than once
			var startTime = trainSchedule[stops[0]][0].dep;
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
		//calendar.push([train.id,1,1,1,1,1,1,1,20100101, 20131231]);

	}

	gtfs_utils.outputGTFSFile(trips, outputFolder, 'trips');
	gtfs_utils.outputGTFSFile(stopTimes, outputFolder, 'stop_times');
	gtfs_utils.outputGTFSFile(calendar, outputFolder, 'calendar');
	gtfs_utils.outputGTFSFile(frequencies, outputFolder, 'frequencies');
}