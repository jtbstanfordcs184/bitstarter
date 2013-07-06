#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(contents) {
    return cheerio.load(contents);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(contents, checksfile) {
    $ = cheerioHtmlFile(contents);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var reportChecks = function(checks) {
  console.log(JSON.stringify(checks, null, 4));
};

if(require.main == module) {
    program
        .option('-c, --checks <file>', 'Path to checks.json', assertFileExists)
        .option('-f, --file <file>', 'Path to file to grade', assertFileExists)
        .option('-u, --url <url>', 'Url to file to grade')
        .parse(process.argv);
    if (program.file) {
      var out = checkHtmlFile(fs.readFileSync(program.file), program.checks);
      reportChecks(out);
    } else if (program.url) {
      restler.get(program.url).on('complete', function(result, response) {
        if (result instanceof Error) {
          console.log("Cannot access url: %s. %s.", program.url, result);
          process.exit(1);
        }
        var out = checkHtmlFile(result, program.checks);
        reportChecks(out);
      });
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
