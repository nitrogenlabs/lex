const React = require('react');

// Mock implementation of react-markdown
const ReactMarkdown = ({children}) => {
  return React.createElement('div', {
    'data-testid': 'react-markdown',
    dangerouslySetInnerHTML: {__html: children}
  });
};

module.exports = ReactMarkdown;
module.exports.default = ReactMarkdown;