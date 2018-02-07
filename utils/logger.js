const log4js = require('log4js');

let LOG_LEVEL = process.env.LOG_LEVEL || 'DEBUG';
const avalLevels = [
  'TRACE',
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
  'FATAL',
];

const setLogLevel = (logLevel) => {
  if (!avalLevels.some(curLevel => curLevel === logLevel)) {
    return false;
  }

  LOG_LEVEL = logLevel;
  return true;
};

const createLogger = (moduleName) => {
  const curLogger = log4js.getLogger(moduleName);
  curLogger.level = LOG_LEVEL;

  return curLogger;
};

module.exports = {
  setLogLevel,
  createLogger,
};
