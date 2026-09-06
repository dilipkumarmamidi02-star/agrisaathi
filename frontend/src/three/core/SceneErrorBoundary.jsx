import { Component } from 'react';

/**
 * The 3D layer is an enhancement, never load-bearing (spec #75, #78).
 * If a scene throws (WebGL context loss, a bad prop, an OOM on a low-end
 * phone), we swallow it and render the fallback instead of taking the
 * whole page down with it.
 */
export default class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error) {
     
    console.warn('[3D scene] recovered from render error:', error);
  }

  render() {
    if (this.state.crashed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
