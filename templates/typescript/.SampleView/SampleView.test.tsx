import * as React from 'react';
import * as renderer from 'react-test-renderer';

import {SampleView} from './SampleView';

describe('SampleView', () => {
  let rendered;

  beforeAll(() => {
    // Render
    rendered = renderer.create(<SampleView />);
  });

  it('should render', () => {
    return expect(rendered).toBeDefined();
  });

  it('should match snapshot', () => {
    return expect(rendered).toMatchSnapshot();
  });
});
