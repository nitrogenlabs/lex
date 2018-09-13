module.exports = (locals, callback) => {
  setTimeout(() => {
    callback(JSON.stringify(Object.keys(locals)));
  }, 10);
};
