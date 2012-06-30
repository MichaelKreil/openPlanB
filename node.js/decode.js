var fs = require('fs');
var path = require('path');
var planUtils = require('./modules/plan_utils.js');

var config = fs.readFileSync('config.json', 'utf8');

config = JSON.parse(config);

config.planFolder   = path.resolve(config.planFolder);
config.decodeFolder = path.resolve(config.decodeFolder);
config.csvFolder    = path.resolve(config.csvFolder);

var files = planUtils.getAllPlanFiles(config.planFolder, config.filter, config.recursive);

planUtils.decodeFiles(files, config.decodeFolder);

