import leven from 'leven';

import {OptionsDescriptor} from './OptionsDescriptor';
import {OptionsValidator} from './OptionsValidator';

export class OptionsNormalizer {
  static defaultOptions = {
    descriptor: '',
    logger: {warn: console.warn},
    passThrough: []
  };

  static normalizeOptions(options, optionInfos, opts = OptionsNormalizer.defaultOptions) {
    const {logger: optsLogger = console} = opts;
    const logger = !optsLogger ? {warn() {}} : optsLogger;
    const {descriptor, passThrough} = opts;
    const optionInfoMap = optionInfos.reduce(
      (reduced, optionInfo) => ({...reduced, [optionInfo.name]: optionInfo}),
      {}
    );

    const normalizedOptions = Object.keys(options).reduce((newOptions, key: string) => {
      const optionInfo = optionInfoMap[key];
      let optionName: string = key;
      let optionValue = options[key];

      if(!optionInfo) {
        if(passThrough || passThrough.indexOf(optionName) !== -1) {
          newOptions[optionName] = optionValue;
        } else {
          logger.warn(OptionsNormalizer.createUnknownOptionMessage(optionName, optionValue, optionInfos, descriptor));
        }

        return newOptions;
      }

      const {array, choices, deprecated, default: optionDefault, redirect} = optionInfo;

      if(!deprecated) {
        optionValue = OptionsNormalizer.normalizeOption(optionValue, optionInfo);
      } else if(typeof redirect === 'string') {
        logger.warn(OptionsNormalizer.createRedirectOptionMessage(optionInfo, descriptor));
        optionName = redirect;
      } else if(optionValue) {
        logger.warn(OptionsNormalizer.createRedirectOptionMessage(optionInfo, descriptor));
        optionValue = redirect.value;
        optionName = redirect.option;
      }

      if(choices) {
        const choiceInfo = choices.find((choice) => choice.value === optionValue);

        if(choiceInfo && choiceInfo.deprecated) {
          logger.warn(OptionsNormalizer.createRedirectChoiceMessage(optionInfo, choiceInfo, descriptor));
          optionValue = choiceInfo.redirect;
        }
      }

      if(array && !Array.isArray(optionValue)) {
        optionValue = [optionValue];
      }

      if(optionValue !== optionDefault) {
        OptionsValidator.validateOption(optionValue, optionInfoMap[optionName], {descriptor});
      }

      newOptions[optionName] = optionValue;
      return newOptions;
    }, {});

    return normalizedOptions;
  }

  static normalizeOption(option, optionInfo) {
    return optionInfo.type === 'int' ? Number(option) : option;
  }

  static createUnknownOptionMessage(key, value, optionInfos, descriptor) {
    const messages = [`Ignored unknown option ${descriptor(key, value)}.`];

    const suggestedOptionInfo = optionInfos.find(
      (optionInfo) => leven(optionInfo.name, key) < 3
    );
    if(suggestedOptionInfo) {
      messages.push(`Did you mean ${JSON.stringify(suggestedOptionInfo.name)}?`);
    }

    return messages.join(' ');
  }

  static createRedirectOptionMessage(optionInfo, descriptor) {
    return `${descriptor(optionInfo.name)} is deprecated. Starfire now treats it as ${
      typeof optionInfo.redirect === 'string'
        ? descriptor(optionInfo.redirect)
        : descriptor(optionInfo.redirect.option, optionInfo.redirect.value)}.`;
  }

  static createRedirectChoiceMessage(optionInfo, choiceInfo, descriptor) {
    return `${descriptor(optionInfo.name, choiceInfo.value)} is deprecated. Starfire now treats it as ${descriptor(
      optionInfo.name,
      choiceInfo.redirect)}.`;
  }

  static normalizeApiOptions(options, optionInfos, opts) {
    return OptionsNormalizer.normalizeOptions(options, optionInfos, {
      descriptor: OptionsDescriptor.apiDescriptor,
      ...opts
    });
  }

  static normalizeCliOptions(options, optionInfos, opts) {
    const args = options._ || [];

    const newOptions: any = OptionsNormalizer.normalizeOptions(
      Object.keys(options).reduce(
        (reduced, key) =>
          ({
            ...reduced,
            ...(key.length === 1 // omit alias
              ? null
              : {[key]: options[key]})
          }),
        {}
      ),
      optionInfos,
      {descriptor: OptionsDescriptor.cliDescriptor, ...opts}
    );
    newOptions._ = args; // eslint-disable-line

    return newOptions;
  }
}
