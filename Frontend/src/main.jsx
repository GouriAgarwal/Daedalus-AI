import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(err) { return { error: err } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: '#fff', background: '#050816', minHeight: '100vh', padding: 40, fontFamily: 'monospace' }}>
          <h1 style={{ color: '#EF4444', marginBottom: 16 }}>⚠ Runtime Error</h1>
          <pre style={{ color: '#F87171', whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
          <pre style={{ color: '#94A3B8', whiteSpace: 'pre-wrap', marginTop: 16 }}>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
