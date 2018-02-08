const log = require('logger').createLogger('HANDLERS_CALENDAR');
const calendarModel = require('models/calendar');
const { findUser } = require('handlers/users');
const { WORK_HOURS } = require('consts');
const {
  WRONG_PARAMS,
  NO_SUCH_USER,
  WRONG_PERIOD,
  CANT_ADD_RECORD,
  NO_SUCH_RECORD,
} = require('errors');

const insertNewRecord = async (recordInfo) => {
  if (!recordInfo) {
    // TODO Add validation
    log.warn('Warn_insertNewRecord_0', 'Wrong params');

    throw WRONG_PARAMS;
  }

  try {
    const user = await findUser({ email: recordInfo.email });

    if (!user) {
      log.warn('Warn_insertNewRecord_0', 'No user with such email: ', recordInfo);
      throw NO_SUCH_USER;
    }

    const workedHours = await calendarModel.getSingleUserStat({
      email: recordInfo.email,
      date: recordInfo.date,
    });

    if (workedHours + (recordInfo.period || 8) > WORK_HOURS) {
      log.warn('Warn_insertNewRecord_1', 'Too much work time: ', workedHours, recordInfo);

      throw WRONG_PERIOD;
    }

    const newRecord = await calendarModel.saveNewRecord(recordInfo);

    if (!newRecord) {
      throw CANT_ADD_RECORD;
    }

    return newRecord;
  } catch (err) {
    log.error('Error_insertNewRecord_last', err.message, recordInfo);

    throw err;
  }
};

const getRecord = async (query) => {
  if (!query) {
    log.warn('Warn_getRecord_0', 'Wrong params');

    throw WRONG_PARAMS;
  }

  try {
    const record = await calendarModel.getSingleRecord(query);

    log.debug('Debug_getRecord_0', query, record);

    if (!record) {
      log.warn('Warn_getRecord_0', 'No such record: ', query);

      throw NO_SUCH_RECORD;
    }

    return record;
  } catch (err) {
    log.error('Error_getRecord_last', err.message, query);

    throw err;
  }
};

module.exports = {
  insertNewRecord,
  getRecord,
};

