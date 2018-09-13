module.exports = (locals) => new Promise((resolve) => {
  switch(locals.path) {
    case '/': {
      return resolve(locals.template({
        path: locals.path
      }));
    }
    default: {
      return resolve('404');
    }
  }
});
