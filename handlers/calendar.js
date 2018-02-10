const log = require('logger').createLogger('HANDLERS_CALENDAR');
const calendarModel = require('models/calendar');
const { findUser } = require('handlers/users');
const { WORK_HOURS, NUM_PROCESSED_RECORDS } = require('consts');
const {
  WRONG_PARAMS,
  NO_SUCH_USER,
  WRONG_PERIOD,
  CANT_ADD_RECORD,
  NO_SUCH_RECORD,
  NOT_CORRECT_RECORD,
} = require('errors');
const { getIn, correctDate, readFilePromise } = require('common');

const checkRecord = async (recordInfo, needThrow = false) => {
  try {
    const user = await findUser({ email: recordInfo.email });

    if (false) { // !user) {
      log.warn('Warn_checkRecord_0', 'No user with such email: ', recordInfo);

      if (needThrow) {
        throw NO_SUCH_USER;
      } else {
        return false;
      }
    }

    const workedHours = await calendarModel.getSingleUserStat({
      email: recordInfo.email,
      date: new Date(correctDate(recordInfo.date)),
    });

    log.debug(workedHours, {
      email: recordInfo.email,
      date: new Date(correctDate(recordInfo.date)),
    });

    if (workedHours + (recordInfo.period || 8) > WORK_HOURS) {
      log.warn('Warn_checkRecord_1', 'Too much work time: ', workedHours, recordInfo);

      if (needThrow) {
        throw WRONG_PERIOD;
      } else {
        return false;
      }
    }

    return true;
  } catch (err) {
    log.error('Error_checkRecord_0', err.message);
    throw err;
  }
};

const correctParams = (newRecord) => {
  const { date } = newRecord;

  return Object.assign({}, newRecord, {
    date: new Date(correctDate(date)),
    isDeleted: false,
    note: newRecord.note || '',
    period: newRecord.period || WORK_HOURS,
    __v: 0,
  });
};

const insertNewRecord = async (recordInfo, needThrow = true) => {
  if (!recordInfo) {
    log.warn('Warn_insertNewRecord_0', 'Wrong params');

    if (needThrow) {
      throw WRONG_PARAMS;
    } else {
      return null;
    }
  }

  try {
    const isCorrectRecord = await checkRecord(recordInfo, needThrow);

    if (!isCorrectRecord) {
      if (needThrow) {
        throw NOT_CORRECT_RECORD;
      } else {
        return null;
      }
    }

    const newRecord = needThrow ? await calendarModel.saveNewRecord(correctParams(recordInfo)) :
      await calendarModel.Calendar.collection.insert(correctParams(recordInfo));

    if (!newRecord) {
      if (needThrow) {
        throw CANT_ADD_RECORD;
      } else {
        return null;
      }
    }

    return newRecord.toJSON ? newRecord.toJSON() : newRecord;
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

const convertParams2Query = params => (Object.assign({
  date: {
    $gte: new Date(correctDate(params.from || '01.01.1900')),
    $lte: new Date(correctDate(params.to || '01.01.2100')),
  },
}, params.email ? { email: params.email } : {}));

const getRecords = async (params) => {
  try {
    const query = convertParams2Query(params);
    log.debug('query: ', query);
    const cursor = calendarModel.Calendar.find(query).sort({ date: 1 }).cursor();

    return cursor;
  } catch (err) {
    log.error('Error_getRecords_0', err.message);

    throw err;
  }
};

const updateRecord = async (recordId, recordInfo) => {
  if (!recordId || !recordInfo) {
    log.warn('Warn_updateRecord_0', 'Wrong params', recordId, recordInfo);
    throw WRONG_PARAMS;
  }

  try {
    const wasUpdated = await calendarModel.updateRecord({ _id: recordId }, recordInfo);

    return wasUpdated;
  } catch (err) {
    log.error('Error_updateRecord_last', err.message, recordId, recordInfo);

    throw err;
  }
};

const insertRecords = async (records, from, to) => {
  const lenRecords = records.length;

  try {
    const insertedHandlers = [];

    for (let i = from; i < to && i < lenRecords; ++i) {
      insertedHandlers.push(insertNewRecord(records[i], false));
    }

    const results = await Promise.all(insertedHandlers);

    return results.filter(result => result !== null).length;
  } catch (err) {
    log.error('Error_insertRecords_last', err.message);

    throw err;
  }
};

const handleRecords = async (records) => {
  const lenRecords = records.length;
  let curNumRecord = 0;
  let numInserted = 0;

  try {
    while (curNumRecord < lenRecords) {
      const lastRecordNumber = curNumRecord + NUM_PROCESSED_RECORDS;
      numInserted += await insertRecords(records, curNumRecord, lastRecordNumber);

      curNumRecord = lastRecordNumber;
    }

    log.info('Info_handleRecords_0', 'Number of inserted records: ', numInserted);

    return numInserted;
  } catch (err) {
    log.error('Error_handleRecords_last', err.message);

    throw err;
  }
};

const uploadRecordsFromFile = async (fileInfo) => {
  const filePath = getIn(fileInfo, ['file', 'path']);

  if (!filePath) {
    log.error('Error_uploadRecordsFromFile_1', 'No file path', fileInfo);
    throw WRONG_PARAMS;
  }

  try {
    // TODO Check headers
    const recordsStr = await readFilePromise(filePath, 'utf-8');
    const records = JSON.parse(recordsStr);

    handleRecords(records);

    return true;
  } catch (err) {
    log.error('Error_uploadRecordsFromFile_last', err.message, fileInfo);

    throw err;
  }
};

const convertStatParams2Query = (params) => {
  try {
    const res = {
      date: {
        $gte: new Date(correctDate(params.from || '01.01.1900')),
        $lte: new Date(correctDate(params.to || '01.01.2100')),
      },
    };

    if (params.emails && typeof params.emails === 'string') {
      const parsedEmails = JSON.parse(params.emails);

      return Object.assign({}, res, {
        email: { $in: Array.isArray(parsedEmails) ? parsedEmails : [parsedEmails] },
      });
    } else if (params.emails) {
      throw WRONG_PARAMS;
    } else {
      return res;
    }
  } catch (err) {
    log.error('Error_convertStatParams2Query_last', 'Cant parse query params: ', params);

    throw WRONG_PARAMS;
  }
};

const getStat = async (params) => {
  if (!params) {
    log.warn('Warn_getStat_0', 'Wrong params');

    throw WRONG_PARAMS;
  }

  try {
    const query = convertStatParams2Query(params);
    log.debug('query: ', query);

    const res = await calendarModel.getStatistic(query);

    return res;
  } catch (err) {
    log.error('Error_getStat_last', err.message);

    throw err;
  }
};

module.exports = {
  insertNewRecord,
  getRecord,
  getRecords,
  uploadRecordsFromFile,
  getStat,
  updateRecord,
};

