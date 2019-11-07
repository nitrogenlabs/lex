export class OptionsDescriptor {
  static apiDescriptor(name, value?) {
    return arguments.length === 1
      ? JSON.stringify(name)
      : `\`{ ${OptionsDescriptor.apiDescriptor(name)}: ${JSON.stringify(value)} }\``;
  }

  static cliDescriptor(name: string, value: boolean = false) {
    return value === false
      ? `\`--no-${name}\``
      : value === true || arguments.length === 1
        ? `\`--${name}\``
        : value === ''
          ? `\`--${name}\` without an argument`
          : `\`--${name}=${value}\``;
  }
}
