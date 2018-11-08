/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {declare} from '@babel/helper-plugin-utils';

const lexConfig = JSON.parse(process.env.LEX_CONFIG || '{}');
const {babel} = lexConfig;
const {plugins = [], presets = []} = babel;

export default declare((api) => {
  api.assertVersion(7);
  return {plugins, presets};
});
