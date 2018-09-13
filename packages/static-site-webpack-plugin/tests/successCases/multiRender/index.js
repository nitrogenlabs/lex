module.exports = (locals) => {
  const template = (path) => locals.template({html: `<h1>${path}</h1>`});

  return {
    '/': template('/'),
    '/foo': template('/foo'),
    '/foo/bar': template('/foo/bar')
  };
};
