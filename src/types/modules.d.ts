declare module 'find-file-up' {
  const findFileUp: any;
  export default findFileUp;
}

declare module 'lodash/*.js' {
  const value: any;
  export default value;
}

declare module 'pacote' {
  const pacote: {
    extract: (spec: string, destination: string, options?: Record<string, unknown>) => Promise<void>;
  };

  export default pacote;
}

declare module 'ws' {
  export class WebSocketServer {
    constructor(options?: any);
    on(event: string, listener: (...args: any[]) => void): this;
    close(): void;
  }
}
