module.exports = (locals) => {
  const template = (path) => locals.template({html: `<h1>${path}</h1>`});

  return {
    '/custom.html': template('/custom.html'),
    '/foo/bar/custom.html': template('/foo/bar/custom.html'),
    '/foo/custom.html': template('/foo/custom.html')
  };
};
