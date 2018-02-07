const log = require('logger').createLogger('HANDLERS_USERS');
const userModel = require('models/users');

const insertNewUser = async (userInfo) => {
  if (!userInfo) {
    // TODO Add validation
    log.warn('Warn_insertNewUser_0', 'Wrong params');

    throw new Error('Wrong params');
  }

  try {
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

const updateUser = async (userId, userInfo) => {
  if (!userId || !userInfo) {
    log.warn('Warn_updateUser_0', 'Wrong params', userId, userInfo);
    throw new Error('Wrong params');
  }

  try {
    const wasUpdated = await userModel.updateUser({
      _id: userId,
      isDeleted: false,
    }, userInfo);

    return wasUpdated;
  } catch (err) {
    log.error('Error_updateUser_0', err.message, userId, userInfo);

    throw err;
  }
};

const findUser = async (userId) => {
  if (!userId) {
    log.warn('Warn_findUser_0', 'Wrong params');
    throw new Error('Wrong params');
  }

  try {
    const user = await userModel.getUser({ _id: userId, isDeleted: false });

    log.debug('Debug_findUser_0', user);

    if (!user) {
      log.warn('Warn_findUser_0', 'No user with such id: ', userId)
      throw new Error('No such user');
    }

    return user;
  } catch (err) {
    log.error('Error_findUser_0', err.message, userId);

    throw err;
  }
};

module.exports = {
  insertNewUser,
  updateUser,
  findUser,
};
