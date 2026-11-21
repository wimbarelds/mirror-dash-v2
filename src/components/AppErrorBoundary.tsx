import { Component, ReactNode } from 'react';

const RELOAD_DELAY = 30 * 1000;

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** If rendering throws, React blanks the page for good; reload it instead */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  #timeout: ReturnType<typeof setTimeout> | undefined;

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('App crashed, reloading shortly', error);
    this.#timeout = setTimeout(() => window.location.reload(), RELOAD_DELAY);
  }

  componentWillUnmount() {
    clearTimeout(this.#timeout);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <p className="p-8 text-2xl font-light text-white/40">Er ging iets mis, opnieuw laden…</p>
    );
  }
}
