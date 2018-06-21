import './sampleView.css';

import {Flux} from 'arkhamjs';
import * as React from 'react';

export interface SampleViewState {
  readonly content: string;
}

export class SampleView extends React.Component<{}, SampleViewState> {
  constructor(props) {
    super(props);

    // Methods
    this.onUpdate = this.onUpdate.bind(this);

    // Initial state
    this.state = {
      content: Flux.getState('app.content', '')
    };
  }

  componentWillMount() {
    // Add listeners
    Flux.on('Sample_UPDATE', this.onUpdate);
  }

  componentWillUnmount() {
    // Remove listeners
    Flux.off('Sample_UPDATE', this.onUpdate);
  }

  onUpdate() {
  }

  render(): JSX.Element {
    return (
      <div className="view-sample">
        Hello World
      </div>
    );
  }
}
