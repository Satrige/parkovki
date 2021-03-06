const log = require('logger').createLogger('HANDLERS_USERS');
const userModel = require('models/users');
const { CANT_ADD_USER, WRONG_PARAMS } = require('errors');
const { validateEmail } = require('common');

const checkInputParams = (params) => {
  const {
    name,
    email,
    phone,
    note,
  } = params;

  if (!email || !validateEmail(email)) {
    log.warn('Warn_checkInputParams_0', 'Wrong email', params);
    return false;
  }

  if (!name || typeof name !== 'string') {
    log.warn('Warn_checkInputParams_1', 'Wrong name', params);
    return false;
  }

  if (note && typeof note !== 'string') {
    log.warn('Warn_checkInputParams_2', 'Wrong note', params);
    return false;
  }

  if (!phone || typeof phone !== 'string') {
    log.warn('Warn_checkInputParams_3', 'Wrong phone', params);
    return false;
  }

  return true;
};

const insertNewUser = async (userInfo) => {
  if (!userInfo || !checkInputParams(userInfo)) {
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

    log.debug('Debug_updateUser_0', wasUpdated, userInfo);

    return wasUpdated;
  } catch (err) {
    log.error('Error_updateUser_0', err.message, userId, userInfo);

    throw err;
  }
};

const findUser = async (query) => {
  if (!query || (!query._id && !query.email)) {
    log.warn('Warn_findUser_0', 'Wrong params', query);
    throw WRONG_PARAMS;
  }

  try {
    const user = await userModel.getUser({ ...query, isDeleted: false });

    log.debug('Debug_findUser_0', user);

    if (!user) {
      log.warn('Warn_findUser_0', 'No user with such query: ', query);

      return null;
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
