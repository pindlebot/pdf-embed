import React from 'react';
import Draggable from 'react-draggable';
import ContentEditable from './ContentEditable'

class DraggableContentEditable extends React.Component {

  eventLogger = (e, data) => {
    console.log('Event: ', e);
    console.log('Data: ', data);
  };

  render() {
    const { defaultPosition } = this.props;

    return (
      <div
      style={{
        backgroundColor: '#ddd',
        padding: '2px',
        //positon: 'absolute',
        height: 0
      }}
      >
      <Draggable
        axis="both"
        handle=".handle"
        defaultPosition={this.props.defaultPosition}
        position={null}
        grid={[20, 20]}
        onStart={this.handleStart}
        onDrag={this.handleDrag}
        onStop={this.handleStop}
        >
        <div>
          <div className="handle">X</div>
          <ContentEditable />
        </div>
      </Draggable>
      </div>
    );
  }
}

export default DraggableContentEditable;