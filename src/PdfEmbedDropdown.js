import React from 'react'
import Dropdown from 'react-simple-dropdown'

const DropdownTrigger = Dropdown.DropdownTrigger
const DropdownContent = Dropdown.DropdownContent

class ContentEditableDropdown extends React.Component {
  render () {
    return (
      <div style={this.props.styles}>
        <button
          style={{backgroundColor: '#000', color: '#fff'}}
          onMouseDown={this.props.startDragging}
          onMouseUp={this.props.stopDragging}
          style={{ cursor: 'move' }}
        >
            MOVE
        </button>
        <button onClick={this.props.handleDelete}>X</button>
      </div>
    )
  }
}

export default ContentEditableDropdown
