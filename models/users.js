const mongoose = require('storages/mongo').getDb();
const log = require('logger').createLogger('MODEL_USERS');

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
  delete userInfo.isAdmin;
  delete userInfo.password;
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
  }
  catch (err) {
    log.error('Error_saveNewUser_0', err.message, userInfo);

    throw new Error('Cant save user');
  }
};

const updateUser = async (query, newInfo) => {
  try {
    const updateResp = await User.update(query, newInfo);

    log.debug('Debug_updateUser_0', 'Result of user update: ', updateResp, query, newInfo);

    return updateResp.n === 1;
  } catch (err) {
    log.error('Error_saveNewUser_0', err.message, query, newInfo);

    throw new Error('Cant update user');
  }
};

module.exports = {
  saveNewUser,
  getUser,
  updateUser,
  User,
};
