const mongoose = require('mongoose');
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
}, {
  autoIndex: true, // In production this property must be false
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

const saveNewUser = async userInfo => {
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

module.exports = {
  saveNewUser,
  User,
};
