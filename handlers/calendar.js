const log = require('logger').createLogger('HANDLERS_CALENDAR');
const calendarModel = require('models/calendar');
const { findUser } = require('handlers/users');
const { WORK_HOURS } = require('consts');
const fs = require('fs');
const {
  WRONG_PARAMS,
  NO_SUCH_USER,
  WRONG_PERIOD,
  CANT_ADD_RECORD,
  NO_SUCH_RECORD,
  CANT_UPLOAD_INFO,
} = require('errors');
const { getIn, correctDate } = require('common');
const JSONStream = require('JSONStream');
const es = require('event-stream');

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
      date: recordInfo.date,
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
    date: correctDate(date),
  });
};

const insertNewRecord = async (recordInfo, needThrow = true) => {
  if (!recordInfo) {
    // TODO Add validation
    log.warn('Warn_insertNewRecord_0', 'Wrong params');

    if (needThrow) {
      throw WRONG_PARAMS;
    } else {
      return null;
    }
  }

  try {
    await checkRecord(recordInfo, needThrow);

    const newRecord = await calendarModel.saveNewRecord(correctParams(recordInfo));

    if (!newRecord) {
      if (needThrow) {
        throw CANT_ADD_RECORD;
      } else {
        return null;
      }
    }

    return newRecord;
  } catch (err) {
    console.dir(err);
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

const uploadRecordsFromFile = (fileInfo) => {
  const filePath = getIn(fileInfo, ['file', 'path']);

  if (!filePath) {
    log.error('Error_uploadRecordsFromFile_1', 'No file path', fileInfo);
    throw WRONG_PARAMS;
  }

  return new Promise((resolve, reject) => {
    const file = new fs.ReadStream(filePath, 'utf-8'); // TODO Check headers
    let numInserted = 0;
    let wasDestoyed = false;

    const destroyStreams = () => {
      if (wasDestoyed) {
        return;
      }

      wasDestoyed = true;
      file.unpipe();
      reject(CANT_UPLOAD_INFO);
    };

    const writerStream = es.mapSync(async (recordInfo) => {
      try {
        const res = await insertNewRecord(recordInfo);
        if (res) {
          ++numInserted;
        }
      } catch (err) {
        log.error('Error_uploadRecordsFromFile_0', err.message);

        destroyStreams();
      }
    });

    const jsonStream = JSONStream.parse('*');

    file
      .pipe(jsonStream)
      .pipe(writerStream);

    file.on('error', destroyStreams);

    writerStream.on('end', () => {
      resolve();
    });
  });
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

