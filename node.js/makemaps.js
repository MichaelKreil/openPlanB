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

scan(inputFolder);

for (var f in folders) if (folders.hasOwnProperty(f)) {
	var folder = folders[f];
	console.log(f);
	if ((folder.files['plankgeo_data.json']) && (folder.files['plankant_data.json'])) {
		makemap(folder.files['plankgeo_data.json'], folder.files['plankant_data.json'], folder.folder);
	}
}

function makemap(geoFile, kantFile, folder) {
	var svg = [];
	svg.push('<?xml version="1.0" encoding="utf-8"?>');
	svg.push('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">');
	svg.push('<svg>');
	
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
				if (true || (px1>13) && (px1<14) && (py1>52.3) && (py1<52.7) &&
					 (px2>13) && (px2<14) && (py2>52.3) && (py2<52.7)) {
					var x1 = (px1-13)*1000;
					var y1 = (py1-52.3)*1750;
					var x2 = (px2-13)*1000;
					var y2 = (py2-52.3)*1750;
					var r = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
					var opa = 2/(siblings[j].dauer+1);
					if (opa > 1) opa = 1;
					svg.push('<line stroke-width="0.1" stroke-opacity="'+opa+'" fill="none" stroke="#000000" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"/>');
				}
			}
		}
	}
	
	svg.push('</svg>');
	fs.writeFileSync(folder+'/map.svg', svg.join('\r'), 'utf8');
	console.log('map');
}

