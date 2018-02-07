const mongoose = require('mongoose');
const log = require('logger').createLogger('MONGO');

mongoose.Promise = global.Promise;
let db = null;

const initMongoConnection = async (config) => {
  try {
    const { host, port, dbName } = config;
    const connectionString = `mongodb://${host}:${port}/${dbName}`;

    db = await mongoose.connect(connectionString, {});

    log.info('Info_initMongoConnection_0', 'Successfully connected to MongoDB');
  } catch (err) {
    log.error('ERROR_INIT_MONGO', 'Failed to init connection to MongoDB', err);
    throw err;
  }
};

const getDb = () => db;

module.exports = {
  getDb,
  initMongoConnection,
};
