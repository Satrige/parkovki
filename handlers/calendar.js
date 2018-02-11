const fs = require('fs');
const log = require('logger').createLogger('HANDLERS_CALENDAR');
const calendarModel = require('models/calendar');
const { findUser } = require('handlers/users');
const {
  WORK_HOURS,
  NUM_PROCESSED_RECORDS,
  AVAL_STATUSES,
  MIN_DATE,
  MAX_DATE,
} = require('consts');
const {
  WRONG_PARAMS,
  NO_SUCH_USER,
  WRONG_PERIOD,
  CANT_ADD_RECORD,
  NO_SUCH_RECORD,
  NOT_CORRECT_RECORD,
  CANT_CHANGE_RESTRICTED_PARAMS,
} = require('errors');
const {
  getIn,
  correctDate,
  readFilePromise,
  validateEmail,
  validateDate,
} = require('common');

const checkInputParams = (params) => {
  const {
    email,
    status,
    name,
    date,
    period,
  } = params;

  if (!email || !validateEmail(email)) {
    log.warn('Warn_checkInputParams_0', 'Wrong email', params);
    return false;
  }

  if (!status || !AVAL_STATUSES.includes(status)) {
    log.warn('Warn_checkInputParams_1', 'Wrong status', params);
    return false;
  }

  if (!name || typeof name !== 'string') {
    log.warn('Warn_checkInputParams_2', 'Wrong name', params);
    return false;
  }

  if (!date || typeof date !== 'string' || !validateDate(date)) {
    log.warn('Warn_checkInputParams_3', 'Wrong date', params);
    return false;
  }

  if (period && (typeof period !== 'number' || period < 0 || period > 8)) {
    log.warn('Warn_checkInputParams_4', 'Wrong period', params);
    return false;
  }

  return true;
};

const checkRecord = async (recordInfo, needThrow = false, needToCheckUser = true) => {
  try {
    if (needToCheckUser) {
      const user = await findUser({ email: recordInfo.email });

      if (!user) {
        log.warn('Warn_checkRecord_0', 'No user with such email: ', recordInfo);

        if (needThrow) {
          throw NO_SUCH_USER;
        } else {
          return false;
        }
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

const insertNewRecord = async (recordInfo, needThrow = true, needToCheckUser = true) => {
  if (!recordInfo || !checkInputParams(recordInfo)) {
    log.warn('Warn_insertNewRecord_0', 'Wrong params');

    if (needThrow) {
      throw WRONG_PARAMS;
    } else {
      return null;
    }
  }

  try {
    const isCorrectRecord = await checkRecord(recordInfo, needThrow, needToCheckUser);

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

    return newRecord.toJSON ? newRecord.toJSON() : newRecord.insertedCount;
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
    $gte: new Date(correctDate(params.from || MIN_DATE)),
    $lte: new Date(correctDate(params.to || MAX_DATE)),
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

  if (recordInfo.email || recordInfo.date) {
    log.warn('Warn_updateRecord_0', 'Try to change restricted fields', recordId, recordInfo);
    throw CANT_CHANGE_RESTRICTED_PARAMS;
  }

  try {
    if (recordInfo.period) {
      const processingRecord = await calendarModel.getSingleRecord({ _id: recordId });
      if (!processingRecord) {
        log.error('Error_updateRecord_0', 'No record with such id', recordId);
        throw NO_SUCH_RECORD;
      }

      const workedHours = await calendarModel.getSingleUserStat({
        email: processingRecord.email,
        date: new Date(processingRecord.date),
      });

      if ((workedHours - processingRecord.period) + recordInfo.period > WORK_HOURS) {
        log.warn('Error_updateRecord_1', 'Too much work time: ', workedHours, recordInfo, processingRecord);

        throw WRONG_PERIOD;
      }
    }

    const wasUpdated = await calendarModel.updateRecord({ _id: recordId }, recordInfo);

    return wasUpdated;
  } catch (err) {
    log.error('Error_updateRecord_last', err.message, recordId, recordInfo);

    throw err;
  }
};

const insertRecords = async (records, from, to, needToCheck = false) => {
  const lenRecords = records.length;

  try {
    const insertedHandlers = [];

    for (let i = from; i < to && i < lenRecords; ++i) {
      insertedHandlers.push(insertNewRecord(records[i], false, needToCheck));
    }

    const results = await Promise.all(insertedHandlers);

    return results.filter(result => result !== null).length;
  } catch (err) {
    log.error('Error_insertRecords_last', err.message);

    throw err;
  }
};

const handleRecords = async (records, needToCheck = false) => {
  const lenRecords = records.length;
  let curNumRecord = 0;
  let numInserted = 0;

  try {
    while (curNumRecord < lenRecords) {
      const lastRecordNumber = curNumRecord + NUM_PROCESSED_RECORDS;
      numInserted += await insertRecords(records, curNumRecord, lastRecordNumber, needToCheck);

      curNumRecord = lastRecordNumber;
    }

    log.info('Info_handleRecords_0', 'Number of inserted records: ', numInserted);

    return numInserted;
  } catch (err) {
    log.error('Error_handleRecords_last', err.message);

    throw err;
  }
};

const uploadRecordsFromFile = async (fileInfo, needToCheck) => {
  const filePath = getIn(fileInfo, ['file', 'path']);

  if (!filePath) {
    log.error('Error_uploadRecordsFromFile_1', 'No file path', fileInfo);
    throw WRONG_PARAMS;
  }

  try {
    const recordsStr = await readFilePromise(filePath, 'utf-8');
    const records = JSON.parse(recordsStr);

    handleRecords(records, needToCheck);
    fs.unlink(filePath);

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
        $gte: new Date(correctDate(params.from || MIN_DATE)),
        $lte: new Date(correctDate(params.to || MAX_DATE)),
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

