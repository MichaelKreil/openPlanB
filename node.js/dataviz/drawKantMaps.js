var fs = require('fs');
var path = require('path');
var planUtils = require('./plan_modules/plan_utils.js');

var config = fs.readFileSync('config.json', 'utf8');

config = JSON.parse(config);

config.planFolder   = path.resolve(config.planFolder);
config.decodeFolder = path.resolve(config.decodeFolder);

var inputFolder = config.decodeFolder;
var recursive = config.recursive;
var folderFilter = config.folderFilter;
	
var folders = [];

scan(inputFolder);
	
	
drawKant();


var tasks = [];
for (var f in folders) if (folders.hasOwnProperty(f)) {
	var folder = folders[f];
	if ((folder.files['plankgeo_data.json']) && (folder.files['plankant_data.json'])) {
		console.log(f);
		drawKantMap(folder.files['plankgeo_data.json'], folder.files['plankant_data.json'], folder.folder);
	}
}
fs.writeFileSync('./mapkant.sh', tasks.join('\n'), 'binary');

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

function drawKantMap(geoFile, kantFile, folder) {
	var
		xMin = 5,
		xMax = 11,
		yMin = 45,
		yMax = 48
		zoom = 1000;
		
	var
		xZoom = 1.0*zoom,
		yZoom = 1.5*zoom,
		width  = (xMax - xMin)*xZoom,
		height = (yMax - yMin)*yZoom;
	
	var output = [];

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
		
	var task = folder.split(' ').join('\\ ');
	task = 'convert -size '+width+'x'+height+' '+task+'/mapkant.mvg '+task+'/mapkant.png';
	tasks.push(task);
}

function ensureFolderFor(filename) {
	var dirname = path.dirname(filename);
	if (!fs.existsSync(dirname)) {
		ensureFolderFor(dirname);
		fs.mkdirSync(dirname);
	}
}
