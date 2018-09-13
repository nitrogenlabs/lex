module.exports = (locals, callback) => {
  callback(locals.template({html: `<h1>"DONT_INCLUDE_ME" is in locals: ${'DONT_INCLUDE_ME' in locals}</h1>`}));
};
