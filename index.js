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

function lint(content, rules, callback, webpack) {
  return htmllint(content, rules)
    .then((issues) => {
      if (issues && issues.length) {
        webpack.emitWarning(formatter(issues));
      }

      return callback(null, content);
    })
    .catch(callback);
}

module.exports = function(content) {
  // unpack options string
  var options = {
    failOnWarning: true
  };

  this.query
    .slice(1)
    .split('&')
    .forEach((pair) => {
      var pair = pair.split('=');
      options[pair[0]] = pair[1];
    });

  if (!options.config) {
    this.emitError('no config')
  }

  var callback = this.async();
  if (!callback) {
    callback = () => {};
  }

  fs.readFile(path.join(process.cwd(), options.config), (error, rulesString) => {
    if (error) {
      return callback(error)
    }

    lint(content, JSON.parse(rulesString), callback, this);
  });
};
