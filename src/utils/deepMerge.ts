/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */

/**
 * Deep merge function that recursively merges objects and arrays
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns The merged object
 */
export const deepMerge = (target: any, source: any): any => {
  if(!source) return target;

  const result = {...target};

  for(const key in source) {
    if(source.hasOwnProperty(key)) {
      if(source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else if(Array.isArray(source[key])) {
        // For arrays, merge if both are arrays, otherwise replace
        if(Array.isArray(target[key])) {
          result[key] = [...target[key], ...source[key]];
        } else {
          result[key] = [...source[key]];
        }
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
};