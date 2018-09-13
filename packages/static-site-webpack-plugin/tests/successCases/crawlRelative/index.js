module.exports = (locals) => new Promise((resolve) => {
  switch(locals.path) {
    case '/': {
      return resolve(locals.template({
        link: 'foo',
        path: locals.path
      }));
    }
    case '/foo': {
      return resolve(locals.template({
        link: './foo/bar',
        path: locals.path
      }));
    }
    case '/foo/bar': {
      return resolve(locals.template({
        link: './bar/baz',
        path: locals.path
      }));
    }
    case '/foo/bar/baz': {
      return resolve(locals.template({
        link: '../../../',
        path: locals.path
      }));
    }
    default: {
      return resolve('404');
    }
  }
});
