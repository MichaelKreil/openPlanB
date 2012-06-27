var planinterface = require('./modules/planinterface.js');

var files;

/*
files = planinterface.findPlan('plankgeo', '..');
for (var i = 0; i < files.length; i++) planinterface.importkgeo(files[i]);

files = planinterface.findPlan('planb', '..');
for (var i = 0; i < files.length; i++) planinterface.importb(files[i]);

files = planinterface.findPlan('planw', '..');
for (var i = 0; i < files.length; i++) planinterface.importw(files[i]);

planinterface.importkgeo('../fahrinfo/DATA/PLANKGEO');
*/

files = planinterface.findPlan('planbz', '..');
for (var i = 0; i < 1; i++) planinterface.importbz(files[i]);