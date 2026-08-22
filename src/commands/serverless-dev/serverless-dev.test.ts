/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {describe, expect, it} from 'vitest';

import {getCorsHeaders} from './serverless-dev.js';

describe('serverless dev CORS headers', () => {
  it('echoes an allowed origin when credentials are enabled', () => {
    expect(getCorsHeaders({
      allowCredentials: true,
      headers: ['Content-Type', 'Authorization'],
      origins: ['http://n7.local:3900']
    }, 'http://n7.local:3900')).toEqual({
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Origin': 'http://n7.local:3900',
      Vary: 'Origin'
    });
  });

  it('does not combine wildcard origins with credentials', () => {
    expect(getCorsHeaders({allowCredentials: true, origins: ['*']}, 'http://n7.local:3900'))
      .toMatchObject({'Access-Control-Allow-Origin': 'http://n7.local:3900'});
  });
});
