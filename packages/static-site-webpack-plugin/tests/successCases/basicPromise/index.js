module.exports = (locals) => Promise.resolve(locals.template({html: `<h1>${locals.path}</h1>`}));
