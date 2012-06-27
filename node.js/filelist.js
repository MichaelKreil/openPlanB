var fs = require('fs');

var files = [];
var scan = function (d) {
	var stats = fs.statSync(d)
	if (stats.isFile()) {
		var d2 = d.split('/');
		var filename = d2.pop();
		files.push([
			d2.join('/'),
			filename,
			stats.size
		]);
	} else if (stats.isDirectory()) {
		var f = fs.readdirSync(d);
		for (var i = 0; i < f.length; i++) scan(d+'/'+f[i]);
	}
}

function exportCSV(filename, data) {
	var a = [];
	for (var i = 0; i < data.length; i++) {
		a.push(data[i].join(';'));
	}
	fs.writeFileSync(filename, a.join('\n'));
}

scan('..');
exportCSV('./files.csv', files);
