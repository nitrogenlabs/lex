module.exports = (locals, callback) => {
  callback(locals.template({html: `<h1>${locals.path}</h1>`}));
};
