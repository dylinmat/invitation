const isEntitled = (entitlements, key) => {
  if (!entitlements || !key) {
    return false;
  }
  return Boolean(entitlements[key]);
};

module.exports = {
  isEntitled
};
