var fs = require('fs');
var path = require('path');
var planDecode = require('./modules/plan_decode.js');

var config = fs.readFileSync('config.json', 'utf8');

config = JSON.parse(config);

config.planFolder   = path.resolve(config.planFolder);
config.decodeFolder = path.resolve(config.decodeFolder);

var files = planDecode.getAllPlanFiles(config);

planDecode.decodeFiles(files, config.decodeFolder);

