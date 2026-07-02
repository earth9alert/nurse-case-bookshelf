import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error)
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'sans-serif',
            background: '#f4f1ea',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>เกิดข้อผิดพลาดที่ไม่คาดคิด</h1>
          <p style={{ color: '#5c5347', margin: 0, maxWidth: 480 }}>
            {this.state.message || 'กรุณาลองโหลดหน้าใหม่ หากปัญหายังคงอยู่ให้ล้างข้อมูลแล้วเริ่มใหม่'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 8,
                border: 'none',
                background: '#c1666b',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ลองอีกครั้ง
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 8,
                border: '1px solid #ccc',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              ล้างข้อมูลและโหลดใหม่
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
