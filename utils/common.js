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


module.exports = {
  isEmpty,
  getIn,
};
