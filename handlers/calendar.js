const log = require('logger').createLogger('HANDLERS_CALENDAR');
const calendarModel = require('models/calendar');
const { findUser } = require('handlers/users');
const { WORK_HOURS } = require('consts');

const insertNewRecord = async (recordInfo) => {
  if (!recordInfo) {
    // TODO Add validation
    log.warn('Warn_insertNewRecord_0', 'Wrong params');

    throw new Error('Wrong params');
  }

  try {
    const user = await findUser({ email: recordInfo.email });

    if (!user) {
      log.warn('Warn_insertNewRecord_0', 'No user with such email: ', recordInfo);
      throw new Error('No such user');
    }

    const workedHours = await calendarModel.getSingleUserStat({
      email: recordInfo.email,
      date: recordInfo.date,
    });

    if (workedHours + (recordInfo.period || 8) > WORK_HOURS) {
      log.warn('Warn_insertNewRecord_1', 'Too much work time: ', recordInfo);

      throw new Error('Wrong working period');
    }

    const newRecord = await calendarModel.saveNewRecord(recordInfo);

    if (!newRecord) {
      throw new Error('Cant add new record to db');
    }

    return newRecord;
  } catch (err) {
    log.error('Error_insertNewRecord_last', err.message);

    throw err;
  }
};

module.exports = {
  insertNewRecord,
};

