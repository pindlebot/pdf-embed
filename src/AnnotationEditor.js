
import Plain from 'slate-plain-serializer'
import { Editor as SlateEditor } from 'slate-react'
import React from 'react'
import classnames from 'classnames'

class ContentEditable extends React.Component {
  state = {
    value: Plain.deserialize(
      (this.props.input && this.props.input.text) || 'Enter some text...'
    )
  }
  
  onChange = (state) => {
    this.setState({ value: state.value }, () => {
      this.props.update(state)
    })
  }

  render() {
    const { selected, hover } = this.props
    const className = classnames(
      'pdf-embed-editor',
      selected ? 'pdf-embed-editor-selected' : '',
      hover ? 'pdf-embed-editor-hover' : ''
    )
    return (
      <div 
        className={className}
        >
        <SlateEditor
          ref={(ref) => { this.editor = ref }}
          placeholder={this.props.placeholder}
          value={this.state.value}
          onChange={this.onChange} 
        />
      </div>
    )
  }
}

ContentEditable.defaultProps = {
  placeholder: 'Enter some text...'
}
export default ContentEditable
