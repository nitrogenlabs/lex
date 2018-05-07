import {Store} from 'arkhamjs';

export class SampleStore extends Store {
  constructor() {
    super('sample');
  }

  initialState(): object {
    return {
    };
  }

  onAction(type: string, data, state): object {
    switch(type) {
      default:
        return state;
    }
  }
}
