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
	fs.writeFileSync(folder+'/mapkant.mvg', output.join('\r'), 'utf8');
}

