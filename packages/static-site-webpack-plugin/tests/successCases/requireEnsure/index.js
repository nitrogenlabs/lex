// Do not actually call this function, because executing require.ensure requires a 'document'.
const dontDoIt = () => {
  require.ensure([], () => {
    require('./foo');
  });
};

console.log('dontDoIt', dontDoIt);

module.exports = (locals, callback) => {
  setTimeout(() => {
    callback(locals.template({html: `<h1>${locals.path}</h1>`}));
  }, 10);
};
