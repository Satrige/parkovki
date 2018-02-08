const log = require('logger').createLogger('ERRORS');

class CustomError {
  constructor(errorMsg, errorCode = 500) {
    this.errorMsg = errorMsg;
    this.errorCode = errorCode;
  }

  // Flag 2 check if custom error
  get isCustom() {
    return true;
  }

  get status() {
    return this.errorCode;
  }

  get message() {
    return this.errorMsg;
  }
}

const INTERNAL_ERROR = new CustomError('Internal_error'); // Smth wrong with code
const CANT_ADD_USER = new CustomError('Cant add new user to db', 400);
const CANT_SAVE_USER = new CustomError('Cant save user to db', 500);
const CANT_UPDATE_USER = new CustomError('Cant update user', 500);
const WRONG_PARAMS = new CustomError('Wrong params', 400);
const NO_SUCH_USER = new CustomError('No such user', 404);
const WRONG_PERIOD = new CustomError('Wrong working period', 400);
const CANT_ADD_RECORD = new CustomError('Cant add new record to db', 400);
const CANT_SAVE_NEW_RECORD = new CustomError('Cant save new record', 500);
const CANT_GET_SINGLE_USER_STAT = new CustomError('Cant retrieve hours info', 500);
const NO_SUCH_RECORD = new CustomError('No such record', 404);

const handleMiddlewareErrors = (error) => {
  if (error.isCustom) {
    return error;
  }

  log.warn('Warn_handleMiddlewareErrors_0', 'Unknown error: ', error);
  return INTERNAL_ERROR;
};

module.exports = {
  INTERNAL_ERROR,
  CANT_ADD_USER,
  WRONG_PARAMS,
  CANT_SAVE_USER,
  CANT_UPDATE_USER,
  NO_SUCH_USER,
  WRONG_PERIOD,
  CANT_ADD_RECORD,
  CANT_SAVE_NEW_RECORD,
  CANT_GET_SINGLE_USER_STAT,
  NO_SUCH_RECORD,
  handleMiddlewareErrors,
};
