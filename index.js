var htmllint = require('htmllint');
var fs = require('fs');
var path = require('path');


/**
 * @param {issue[]} issues list of issues to format
 * @return {string} formatted descriptions of issues
 */
function formatter(issues) {
  function formatLine(issue) {
    return '[' + pad(issue.line, 3) +
      ':' + pad(issue.column, 3) +
      ']:\t' + issue.rule +
      '\t';
  }
  return issues
    .map(formatLine)
    .join('\n');
}

/**
 * @param {number} number value to pad
 * @param {number} size amount to pad to
 * @return {string} padded number
 */
function pad(number, size) {
  var string = number + '';
  while (string.length < size) {
    string = '0' + string;
  }
  return string;
}

module.exports = function(content) {
  var self = this;

  // unpack options string
  var optionMap = {};
  self.query
    .slice(1)
    .split('&')
    .forEach(function(pair) {
      var pair = pair.split('=');
      optionMap[pair[0]] = pair[1];
    });

  if (optionMap.config) {
    optionMap.config = path.join(process.cwd(), optionMap.config);
  } else {
    self.emitError('no config')
  }

  var callback = self.async();
  if (!callback) {
    return lint(content);
  }

  return fs.exists(optionMap.config, function(exists) {
    if (exists) {
      fs.readFile(optionMap.config, function (error, fileString) {

        return htmllint(content, JSON.parse(fileString))
          .catch(function(error, issues) {
            console.log(issues)
            //self.emitError('ERROR', error);
            return callback(error);
          })
          .then(function(issues) {
            if (issues.length) {
              self.emitWarning(formatter(issues));
            }

            return callback(null, issues);
          })

      })
    } else {
      self.emitError('unable to find specified config file');
    }
  })
};
