#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');

var variablesExist = fs.existsSync('variables.env');

//get
console.log('It works!');

//make sure our other pieces are here (check if frontend and prisma are in place) if not clone them and run their boostrappers.
