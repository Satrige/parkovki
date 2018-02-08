const log = require('logger').createLogger('HANDLERS_USERS');
const userModel = require('models/users');
const { CANT_ADD_USER, WRONG_PARAMS, NO_SUCH_USER } = require('errors');

const insertNewUser = async (userInfo) => {
  if (!userInfo) {
    // TODO Add validation
    log.warn('Warn_insertNewUser_0', 'Wrong params');

    throw WRONG_PARAMS;
  }

  try {
    const newUser = await userModel.saveNewUser(userInfo);

    if (!newUser) {
      throw CANT_ADD_USER;
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
    throw WRONG_PARAMS;
  }

  try {
    const wasUpdated = await userModel.updateUser({ _id: userId }, userInfo);

    return wasUpdated;
  } catch (err) {
    log.error('Error_updateUser_0', err.message, userId, userInfo);

    throw err;
  }
};

const findUser = async (query) => {
  if (!query) {
    log.warn('Warn_findUser_0', 'Wrong params');
    throw WRONG_PARAMS;
  }

  try {
    const user = await userModel.getUser({ ...query, isDeleted: false });

    log.debug('Debug_findUser_0', user);

    if (!user) {
      log.warn('Warn_findUser_0', 'No user with such query: ', query);

      throw NO_SUCH_USER;
    }

    return user;
  } catch (err) {
    log.error('Error_findUser_0', err.message, query);

    throw err;
  }
};

module.exports = {
  insertNewUser,
  updateUser,
  findUser,
};
