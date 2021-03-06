const mongoose = require('storages/mongo').getDb();
const log = require('logger').createLogger('MODEL_USERS');
const { CANT_SAVE_USER, CANT_UPDATE_USER } = require('errors');

const UserSchema = mongoose.Schema({
  name: String,
  email: {
    index: true,
    required: true,
    unique: true,
    // TODO add validation
    type: String,
  },
  phone: String,
  note: String,
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  autoIndex: true, // In production this property must be set to false
  collection: 'users',
});

UserSchema.methods.toJSON = function () {
  const userInfo = this.toObject();
  delete userInfo.isDeleted;
  delete userInfo.__v;

  return userInfo;
};

const User = mongoose.model('User', UserSchema);

const getUser = query => User.findOne(query);

const saveNewUser = async (userInfo) => {
  try {
    const newUser = await new User(userInfo).save();

    log.debug('Debug_saveNewUser_0', newUser);

    return newUser;
  } catch (err) {
    log.error('Error_saveNewUser_0', err.message, userInfo);

    throw CANT_SAVE_USER;
  }
};

const updateUser = async (query, newInfo) => {
  try {
    const updateResp = await User.update({ ...query, isDeleted: false }, newInfo);

    log.debug('Debug_updateUser_0', 'Result of user update: ', updateResp, query, newInfo);

    return updateResp.n === 1;
  } catch (err) {
    log.error('Error_saveNewUser_0', err.message, query, newInfo);

    throw CANT_UPDATE_USER;
  }
};

module.exports = {
  saveNewUser,
  getUser,
  updateUser,
  User,
};
