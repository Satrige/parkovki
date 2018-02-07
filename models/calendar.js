const mongoose = require('storages/mongo').getDb();
const log = require('logger').createLogger('MODEL_CALENDAR');
const { WORK_HOURS } = require('consts');

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
    type: String,
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

CalendarSchema.methods.toJSON = function () {
  const calendarInfo = this.toObject();
  delete calendarInfo.isDeleted;
  delete calendarInfo.__v;

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

    throw new Error('Cant save record');
  }
};

const getSingleUserStat = async (query) => {
  try {
    const statInfo = await Calendar
      .aggregate([{
        $match: query,
      }, {
        $group: {
          _id: '$email',
          hours: { $sum: '$period' },
        },
      }]);

    if (statInfo && Array.isArray(statInfo) && statInfo.length) {
      return statInfo[0].hours;
    }

    return 0;
  } catch (err) {
    log.error('Error_getSingleUserStat_0', err.message, query);
    throw err;
  }
};

module.exports = {
  saveNewRecord,
  getSingleUserStat,
  Calendar,
};
