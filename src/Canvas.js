import React from 'react'
import PropTypes from 'prop-types'
import makeCancelable from './makeCancelable'
import ReactDOM from 'react-dom'
import AnnotationEditor from './AnnotationEditor'
import PdfEmbedDropdown from './PdfEmbedDropdown'
import uuid from 'uuid/v4'
import findIndex from 'lodash.findindex'
import createShadow from './createShadow'

require('pdfjs-dist/build/pdf.combined')
require('pdfjs-dist/web/compatibility')

class Canvas extends React.Component {
  state = {
    pdf: null,
    data: [],
    x: null,
    y: null,
    draggable: null,
    focus: 'BODY',
    selected: null
  }
  
  static propTypes = {
    page: PropTypes.number,
    scale: PropTypes.number,
    styles: PropTypes.object,
    className: PropTypes.string,
    spinner: PropTypes.func
  }

  static defaultProps = {
    page: 1,
    scale: 3,
    styles: {
      display: 'block'
    },
    className: 'pdf',
  }

  componentDidMount() {
    const { url } = this.props
    if (url) {
      this.getDocument(url)
    }

    document.addEventListener('keydown', this.onKeyDown)
    const data = window.localStorage.getItem('data')

    if(data) {
      this.setState({
        data: JSON.parse(data)
      })
    }
  }

  onMouseMove = ({ key }) => {
    let { data } = this.state
    const index = findIndex(data, { key })

    return (e) => {  
      data[index].x = e.pageX
      data[index].y = e.pageY
      this.setState({data})
    }
  }

  getBoundingClientRect = () => {
    const rect = this.canvas.getBoundingClientRect()
    return {
      top: rect.top + 20,
      left: rect.left + 20
    }
  }
 

  componentWillReceiveProps(nextProps) {
    if (nextProps.page !== this.props.page) {
      this.drawPDF(nextProps.page)
    }
  }

  onDocumentComplete = async pdf => {
    this.setState({ pdf }, () => {
      this.drawPDF(this.props.page)
    })
  }

  onDocumentError = err => {
    if (err.isCanceled && err.pdf) {
      err.pdf.destroy()
    }
  }

  getDocument = val => {
    if (this.documentPromise) {
      this.documentPromise.cancel()
    }
    this.documentPromise = makeCancelable(
      window.PDFJS.getDocument(val).promise
    )

    this.documentPromise.promise
      .then(this.onDocumentComplete)
      .catch(this.onDocumentError)

    return this.documentPromise
  }

  componentWillUnmount() {
    const { pdf } = this.state
    if (pdf) pdf.destroy()

    if (this.documentPromise) {
      this.documentPromise.cancel()
    }
    document.removeEventListener('keydown', this.onKeyDown)
  }

  drawPDF = async num => {
    const { pdf } = this.state
    const page = await pdf.getPage(num)
    const viewport = page.getViewport(this.props.scale)
    const canvas = this.canvas
    const canvasContext = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    page.render({ canvasContext, viewport })
  }

  handleMouseMove = (e) => {
    const { data, draggable } = this.state
    
    if(draggable) {
      const i = findIndex(data, { key: draggable})
      data[i] = {
        ...data[i],
        x: e.clientX - this.getBoundingClientRect().left,
        y: e.clientY - this.getBoundingClientRect().top,
      }

      this.setState({ x: e.clientX, y: e.clientY, data })
    } else {
      this.setState({ x: e.clientX, y: e.clientY })
    }
  }

  handleClick = () => {
    if(
      this.state.draggable &&
      this.state.selected
    ) {
      this.setState({ draggable: null, selected: null })
      return
    }

    const { x, y, data } = this.state
    const key = uuid()
    data.push({
      x: x - this.getBoundingClientRect().left,
      y: y - this.getBoundingClientRect().top,
      key
    })

    const i = data.length - 1

    this.setState({
      data,
      selected: key
    })
  }

  onKeyDown = (event) => {
    const { selected } = this.state
    if(event.keyCode == 8 && selected) {
      this.handleDelete({ key: selected })
    }
  }

  onMouseEnter = ({ key }) => {
    this.setState({ hover: key })
  }

  onMouseLeave = ({ key }) => {
    this.setState(prevState => {
      if (prevState.draggable === key) {
        return null
      }
      return { hover: null }
    })
  }

  handleDelete = ({ key }) => {    
    let { selected, data } = this.state
    data = data.filter(entry => entry.key !== key)
    this.setState({
      data,
      selected: null,
      draggable: null
    }, () => {
      window.localStorage.setItem('data', JSON.stringify(data))
    })
  }

  startDragging = ({key}) => {
    this.setState({ draggable: key })
  }

  stopDragging = ({key}) => {
    this.setState({ draggable: null })
  }

  selectAnnotation = ({ currentTarget }, { key }) => {    
    if(currentTarget.className !== 'pdf-embed-editor-wrapper') {
      this.setState({ selected: null })
      return
    }
    this.setState(prevState => {
      if (prevState.selected === key) {
        return null
      }
      return { selected: key }
    })
  }

  onFocus = () => this.setState({ focus: 'SLATE' })

  onBlur = () => this.setState({focus: 'BODY'})

  update = ({ value, value: { document: { text } } }, { key }) => {
    const { data } = this.state
    const i = findIndex(data, { key })
    const entry = data[i]
    data[i].text = text
    this.setState({ data }, () => {
      window.localStorage.setItem('data', JSON.stringify(this.state.data))
    })
  }

  renderAnnotations = () => {
    const { data: annotations } = this.state

    return annotations.map((annotation, i) => 
      <div 
        className={'pdf-embed-editor-wrapper'}
        style={{
          transform: `translate3d(${annotation.x}px, ${annotation.y}px, 0px)`
        }}
        ref={c => { this.wrapper = c }}
        onMouseDown={() => this.startDragging(annotation) }
        onMouseUp={() => this.stopDragging(annotation) }
        onMouseEnter={() => this.onMouseEnter(annotation) }
        onMouseLeave={() => this.onMouseLeave(annotation) }
        onClick={(e) => this.selectAnnotation(e, annotation) }
        key={`div_${annotation.key}`}
      >
        <AnnotationEditor 
          key={`annotation_${annotation.key}`}
          input={annotation}
          defaultPosition={annotation} 
          onFocus={this.onFocus} 
          onBlur={this.onBlur}
          handleDelete={() => this.handleDelete(annotation)} 
          hover={this.state.hover === annotation.key}
          selected={this.state.selected === annotation.key ? true : false}
          update={(state) => this.update(state, annotation)}
        />
      </div>
    )
  }

  render() {
    const { pdf } = this.state
    if (!pdf) {
      return false
    }
    const containerStyles = {
      display: 'block',
      fontFamily: 'arial',
      maxWidth: `${612 * 2}`,
      margin: '0 auto',
      ...this.props.containerStyles,
    }
    const { data: annotations } = this.state
    return (
      <div 
        style={containerStyles} 
        onMouseMove={this.handleMouseMove} 
      >
        <div>
          {this.renderAnnotations()}
        </div>
        <div 
          className={'pdf-wrapper'}
          style={{
            width: `${612 * 2}`,
            height: `${792 * 2}`,
          }}>
            <canvas
              ref={c => {
                this.canvas = c
              }}
              className={this.props.className}
              onClick={this.handleClick}
            />
        </div>
        
      </div>
    )
  }
}

export default Canvas
