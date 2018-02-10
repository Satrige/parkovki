const mongoose = require('storages/mongo').getDb();
const moment = require('moment');
const log = require('logger').createLogger('MODEL_CALENDAR');
const { WORK_HOURS } = require('consts');
const { CANT_SAVE_NEW_RECORD, CANT_GET_SINGLE_USER_STAT, CANT_UPDATE_RECORD } = require('errors');
const { getIn } = require('common');

const CalendarSchema = mongoose.Schema({
  email: {
    index: true,
    required: true,
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
  },
  date: {
    index: true,
    type: Date,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['sick', 'vacation', 'remoteWork', 'work'],
    default: 'work',
  },
  period: {
    type: Number,
    default: WORK_HOURS,
  },
}, {
  autoIndex: true, // In production this property must be set to false
  collection: 'calendar',
});

CalendarSchema.index({ email: 1, date: 1 });
CalendarSchema.index({ date: 1 });

CalendarSchema.methods.toJSON = function () {
  const calendarInfo = this.toObject();
  delete calendarInfo.isDeleted;
  delete calendarInfo.__v;

  calendarInfo.date = moment(calendarInfo.date).format('DD.MM.YYYY');

  return calendarInfo;
};

const Calendar = mongoose.model('Calendar', CalendarSchema);

const saveNewRecord = async (recordInfo) => {
  try {
    const newRecord = await new Calendar(recordInfo).save();

    log.debug('Debug_saveNewRecord_0', newRecord);

    return newRecord;
  } catch (err) {
    log.error('Error_saveNewRecord_0', err.message, recordInfo);

    throw CANT_SAVE_NEW_RECORD;
  }
};

const getSingleUserStat = async (query) => {
  try {
    const statInfo = await Calendar
      .aggregate([{
        $match: { ...query, isDeleted: false },
      }, {
        $group: {
          _id: '$email',
          hours: { $sum: '$period' },
        },
      }]);

    return getIn(statInfo, [0, 'hours']) || 0;
  } catch (err) {
    log.error('Error_getSingleUserStat_0', err.message, query);
    throw CANT_GET_SINGLE_USER_STAT;
  }
};

const getSingleRecord = query => Calendar.findOne({ ...query, isDeleted: false });

const updateRecord = async (query, newInfo) => {
  try {
    const updateResp = await Calendar.update({ ...query, isDeleted: false }, newInfo);

    log.debug('Debug_updateRecord_0', 'Result of record update: ', updateResp, query, newInfo);

    return updateResp.n === 1;
  } catch (err) {
    log.error('Error_saveNewRecord_last', err.message, query, newInfo);

    throw CANT_UPDATE_RECORD;
  }
};

const getStatistic = async (query) => {
  try {
    const res = await Calendar
      .aggregate([{
        $match: { ...query, isDeleted: false },
      }, {
        $group: {
          _id: {
            email: '$email',
            status: '$status',
            name: '$name',
          },
          hours: { $sum: '$period' },
        },
      }, {
        $group: {
          _id: {
            email: '$_id.email',
            name: '$_id.name',
          },
          periods: { $push: { status: '$_id.status', days: { $divide: ['$hours', 8] } } },
        },
      }, {
        $project: {
          _id: 0,
          name: '$_id.name',
          periods: 1,
        },
      }]);

    return res;
  } catch (err) {
    log.error('Error_getStatistic_last', err.message);

    throw err;
  }
};

module.exports = {
  saveNewRecord,
  getSingleUserStat,
  getSingleRecord,
  updateRecord,
  getStatistic,
  Calendar,
};
