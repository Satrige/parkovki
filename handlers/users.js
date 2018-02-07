const log = require('logger').createLogger('HANDLERS_USERS');
const userModel = require('models/users');

const insertNewUser = async (userInfo) => {
  try {
    if (!userInfo) {
      // TODO Add validation
      log.warn('Warn_insertNewUser_0', 'Wrong params');

      throw new Error('Wrong params');
    }

    const newUser = await userModel.saveNewUser(userInfo);

    if (!newUser) {
      throw new Error('Cant add new user to db');
    }

    return newUser;
  } catch (err) {
    log.error('Error_insertNewUser_last', err.message);

    throw err;
  }
};

module.exports = {
  insertNewUser,
};
