const fs = require('fs');
const log = require('logger').createLogger('UTILS_COMMON');

const isEmpty = (inst) => {
  // '', null, 'undefined', o, NaN, false
  if (!inst) {
    return true;
  }

  // []
  if (Array.isArray(inst) && !inst.length) {
    return true;
  }

  // {}
  if (!Object.keys(inst).length && inst.constructor === Object) {
    return true;
  }

  return false;
};

const getIn = (obj, props) => {
  if (isEmpty(obj)) {
    return undefined;
  }

  if (!Array.isArray(props)) {
    return obj[props];
  }
  let curObj = obj;
  for (let i = 0, len = props.length; i < len; ++i) {
    const curVal = curObj[props[i]];

    if (!isEmpty(curVal)) {
      curObj = curVal;
    } else {
      return (i === len - 1) ? curVal : undefined;
    }
  }

  return curObj;
};

const correctDate = (date) => {
  const splittedDate = date.split('.');
  return `${splittedDate[1]}.${splittedDate[0]}.${splittedDate[2]}`;
};

const readFilePromise = (path, encoding) => new Promise((resolve, reject) => {
  fs.readFile(path, encoding, (err, contents) => {
    if (err) {
      log.error('Error_readFilePromise_last', err.message);
      reject(err);
    } else {
      resolve(contents);
    }
  });
});

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const validateDate = (date) => {
  const re = /^(0[1-9]|[12]\d|3[01]).(0[1-9]|1[0-2]).[12]\d{3}$/;
  return re.test(date);
};

module.exports = {
  isEmpty,
  getIn,
  correctDate,
  validateEmail,
  validateDate,
  readFilePromise,
};
