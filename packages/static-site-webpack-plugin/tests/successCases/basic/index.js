module.exports = (locals, callback) => {
  setTimeout(() => {
    callback(locals.template({html: `<h1>${locals.path}</h1>`}));
  }, 10);
};
