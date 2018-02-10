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

module.exports = {
  isEmpty,
  getIn,
  correctDate,
  readFilePromise,
};
