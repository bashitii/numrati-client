import { Component } from 'react'
import type { ReactNode } from 'react'
import { ErrorState } from '../pages/ErrorPage'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return <ErrorState onRetry={() => window.location.assign('/home')} />
    return this.props.children
  }
}
