var fs = require('fs');
var path = require('path');
var planUtils = require('./modules/plan_utils.js');

var config = fs.readFileSync('config.json', 'utf8');

config = JSON.parse(config);

config.planFolder   = path.resolve(config.planFolder);
config.decodeFolder = path.resolve(config.decodeFolder);

var inputFolder = config.decodeFolder;
var recursive = config.recursive;
var folderFilter = config.folderFilter;
	
var folders = [];

scan(inputFolder);
	
	
drawBz();
//drawKant();



function scan(fol) {
	var stats = fs.statSync(fol)
	if (stats.isFile()) {
		var folder = fol.split('/');
		var filename = folder.pop();
		folder = folder.join('/');
		var filetype = filename.toLowerCase();
		var extension = filetype.split('.').pop();
		
		if (extension == 'json') {
			if (folders[folder] === undefined) folders[folder] = {folder:folder, files:{}};
			folders[folder].files[filetype] = fol;
		}
	} else if (recursive && stats.isDirectory()) {
		var f = fs.readdirSync(fol);
		for (var i = 0; i < f.length; i++) scan(fol + '/' + f[i]);
	}
}

function drawBz() {
	
	for (var f in folders) if (folders.hasOwnProperty(f)) {
		var folder = folders[f];
		if ((folder.files['plankgeo_data.json']) && (folder.files['planbz_data.json'])) {
			console.log(f);
			drawMap(folder.files['plankgeo_data.json'], folder.files['planbz_data.json'], folder.folder+'/frames');
		}
	}
	
	function drawMap(geoFile, bzFile, folder) {
		var
			xMin = 12.8,
			xMax = 14,
			yMin = 52.2,
			yMax = 52.8
			zoom = 2000;
			
		var
			xZoom = 0.6*zoom,
			yZoom = 1.0*zoom,
			width  = Math.round((xMax - xMin)*xZoom),
			height = Math.round((yMax - yMin)*yZoom);
		
		console.log('Load Geo');
		var geo = JSON.parse(fs.readFileSync(geoFile, 'utf8'));
		
		console.log('Load BZ');
		var bz  = JSON.parse(fs.readFileSync( bzFile, 'utf8'));
		
		console.log('Prepare stuff');
		
		var sys = require('util');
		var exec = require('child_process').exec;
		ensureFolderFor(folder+'/mapkant.mvg');
		
		// times by station -> times by trains
		var temp = [];
		for (var i = 0; i < bz.length; i++) {
			var stationId = bz[i].id;
			var times = bz[i].times;
			for (var j = 0; j < times.length; j++) {
				var tupel = times[j];
				if ((tupel.arr > 0) || (tupel.dep > 0)) {
					var trainId = tupel.trainId;
					if (temp[trainId] === undefined) temp[trainId] = [];
					temp[trainId].push({
						stationId:stationId,
						t0:tupel.arr,
						t1:tupel.dep
					});
				}
			}
		}
		
		// sort trains
		var trains = [];
		for (var i = 0; i < temp.length; i++) {
			if (temp[i] !== undefined) {
				temp[i].sort(function(a,b) {
					return a.t0 - b.t0;
				});
				
				var oldList = temp[i];
				var newList = [oldList[0]];
				
				for (var j = 1; j < oldList.length; j++) {
					if (oldList[j].t0 > oldList[j-1].t0) newList.push(oldList[j]);
				}
				
				for (var j = 0; j < newList.length; j++) {
					var r = (newList[j].stationId % 100)/100; 
					if (newList[j].t0 >= 0) newList[j].t0 = Math.round(newList[j].t0*60 - r*20 - 10);
					if (newList[j].t1 >= 0) newList[j].t1 = Math.round(newList[j].t1*60 + r*20 + 10);
				}
				
				trains.push(newList);
			}
		}
		temp = undefined;
		
		fs.writeFileSync(folder+'/temp.json', JSON.stringify(trains, null, '\t'), 'binary');
		
		// prepare geo
		
		for (var i = 0; i < geo.length; i++) {
			geo[i].x = (geo[i].lon - xMin)*xZoom;
			geo[i].y = (yMax - geo[i].lat)*yZoom;
		}
		
		var tasks = [];
		for (var i = 0; i < 1440; i++) {
			drawFrame(0 + i*60, i);
		}
		fs.writeFileSync(folder+'/mapkant.sh', tasks.join('\n'), 'binary');
		
		
		function drawFrame(time, frameNo) {
			console.log('draw '+frameNo);
			var output = [];
			output.push('push graphic-context');
			output.push('viewbox 0 0 '+width+' '+height);
			output.push('affine 1 0 0 1 0 0');
			
			for (var i = 0; i < trains.length; i++) {
				var stations = trains[i];
				var n = stations.length;
				
				var x = -1000, y = -1000;
				
				if (time < stations[0].t1) {
					// did not departure
				} else if (time > stations[n-1].t0) {
					// already arrived
				} else {
					// on the track
					for (var j = 0; j < n-1; j++) {
						if (time >= stations[j].t1) {
							var s0 = stations[j  ];
							var s1 = stations[j+1];
							
							//	 console.log(s0.stationId, s1);
							
							x = (geo[s1.stationId].x - geo[s0.stationId].x)*((time - s0.t1)/(s1.t0 - s0.t1)) +  geo[s0.stationId].x;
							y = (geo[s1.stationId].y - geo[s0.stationId].y)*((time - s0.t1)/(s1.t0 - s0.t1)) +  geo[s0.stationId].y;
							break;
						}
					}
				}
				
				if ((x >= 0) && (y >= 0) && (x <= width) && (y <= height)) {
					output.push('push graphic-context');
					output.push('stroke-width 0');
					//output.push('opacity '+(opa*100)+'%');
					output.push('circle '+(x-1)+','+(y-1)+' '+(x+1)+','+(y+1));
					output.push('pop graphic-context');
				}
			}
			
			output.push('pop graphic-context');
			
			
			fs.writeFileSync(folder+'/mapkant'+frameNo+'.mvg', output.join('\r'), 'binary');
			// http://nodejs.org/api.html#_child_processes
			
			var task = folder.split(' ').join('\\ ');
			task = 'convert -size '+width+'x'+height+' '+task+'/mapkant'+frameNo+'.mvg '+task+'/mapkant'+frameNo+'.png';
			tasks.push(task);
		}
	}
}

function drawKant() {
	
	for (var f in folders) if (folders.hasOwnProperty(f)) {
		var folder = folders[f];
		if ((folder.files['plankgeo_data.json']) && (folder.files['plankant_data.json'])) {
			console.log(f);
			drawKantMap(folder.files['plankgeo_data.json'], folder.files['plankant_data.json'], folder.folder);
		}
	}
	
	function drawKantMap(geoFile, kantFile, folder) {
		var
			xMin = 5,
			xMax = 16,
			yMin = 46,
			yMax = 56
			zoom = 600;
			
		var
			xZoom = 1.0*zoom,
			yZoom = 1.5*zoom,
			width  = (xMax - xMin)*xZoom,
			height = (yMax - yMin)*yZoom;
		
		var output = [];
		/*output.push('<?xml version="1.0" encoding="utf-8"?>');
		output.push('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">');
		output.push('<svg version="1.1" x="0px" y="0px" width="'+width+'px" height="'+height+'px">');*/
		output.push('push graphic-context');
		output.push('viewbox 0 0 '+width+' '+height);
		output.push('affine 1 0 0 1 0 0');
		
		
		var geo  = JSON.parse(fs.readFileSync(geoFile , 'utf8'));
		var kant = JSON.parse(fs.readFileSync(kantFile, 'utf8'));
		
		for (var i = 0; i < kant.length; i++) {
			var id1 = kant[i].bahnhofid;
			var px1 = geo[id1].lon;
			var py1 = geo[id1].lat;
			var siblings = kant[i].kanten;
			for (var j = 0; j < siblings.length; j++) {
				var id2 = siblings[j].bahnhofid;
				if (id1 < id2) {
					var px2 = geo[id2].lon;
					var py2 = geo[id2].lat;
	
					var x1 = (px1 - xMin)*xZoom, y1 = (yMax - py1)*yZoom;
					var x2 = (px2 - xMin)*xZoom, y2 = (yMax - py2)*yZoom;
					
					var r = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2))/zoom;
					var opa = 10*r/(siblings[j].dauer+1);
					if (opa > 1) opa = 1;
					//output.push('<line stroke-width="0.02" stroke-opacity="'+opa+'" stroke="#000000" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>');
					
					output.push('push graphic-context');
					output.push('stroke-width 1');
					output.push('opacity '+(opa*100)+'%');
					output.push('line '+x1+','+y1+' '+x2+','+y2);
					output.push('pop graphic-context');
				}
			}
		}
		
		//output.push('</svg>');	
		output.push('pop graphic-context');
		fs.writeFileSync(folder+'/mapkant.mvg', output.join('\r'), 'binary');
	}
}

function ensureFolderFor(filename) {
	var dirname = path.dirname(filename);
	if (!fs.existsSync(dirname)) {
		ensureFolderFor(dirname);
		fs.mkdirSync(dirname);
	}
}
