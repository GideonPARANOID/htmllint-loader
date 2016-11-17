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
  // unpack options string
  var optionMap = {
    failOnWarning: true
  };

  this.query
    .slice(1)
    .split('&')
    .forEach((pair) => {
      var pair = pair.split('=');
      optionMap[pair[0]] = pair[1];
    });

  if (optionMap.config) {
    optionMap.config = path.join(process.cwd(), optionMap.config);
  } else {
    this.emitError('no config')
  }

  var callback = this.async();
  if (!callback) {
    callback = () => {};
  }

  return fs.exists(optionMap.config, (exists) => {
    if (exists) {
      fs.readFile(optionMap.config, (error, fileString) => {

        return htmllint(content, JSON.parse(fileString))
          .then((issues) => {
            if (issues && issues.length) {
              this.emitWarning(formatter(issues));
            }

            return callback(null, issues);
          })
          .catch(callback);
      })
    } else {
      this.emitError('unable to find specified config file');
    }
  })
};
