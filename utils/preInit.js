const logMod = require('logger');
const config = require('config');

const log = logMod.createLogger('PREINIT');

const { initMongoConnection } = require('storages/mongo');

const preInit = () => {
  logMod.setLogLevel(process.env.LOG_LEVEL || 'DEBUG');

  return initMongoConnection(config.db);
};

module.exports = {
  preInit,
};
