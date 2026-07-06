import React from 'react'

/**
 * DebugErrorBoundary — temporary diagnostic tool. Catches render errors
 * and shows the actual error message + stack on screen, instead of the
 * blank page React shows by default when a component throws.
 */
export default class DebugErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    this.setState({ info })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:24, background:'#2a1414', border:'1px solid #6b2c2c', borderRadius:6, fontFamily:'var(--font-mono)' }}>
          <p style={{ color:'#ff8a8a', fontWeight:700, marginBottom:10, fontSize:14 }}>
            Render error caught: {this.state.error?.message || String(this.state.error)}
          </p>
          <pre style={{ color:'#d99', fontSize:11, whiteSpace:'pre-wrap', overflowX:'auto' }}>
            {this.state.error?.stack}
          </pre>
          {this.state.info?.componentStack && (
            <pre style={{ color:'#a88', fontSize:10, whiteSpace:'pre-wrap', marginTop:10, overflowX:'auto' }}>
              {this.state.info.componentStack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
