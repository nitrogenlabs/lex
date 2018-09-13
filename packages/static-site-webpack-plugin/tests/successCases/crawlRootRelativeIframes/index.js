module.exports = (locals) => new Promise((resolve) => {
  switch(locals.path) {
    case '/': {
      return resolve(locals.template({path: locals.path, src: '/foo'}));
    }
    case '/foo': {
      return resolve(locals.template({path: locals.path, src: '/foo/bar'}));
    }
    case '/foo/bar': {
      return resolve(locals.template({path: locals.path, src: 'javascript:void(0)'}));
    }
    default: {
      return resolve('404');
    }
  }
});
