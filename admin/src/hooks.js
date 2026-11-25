import { useEffect, useState, useCallback } from 'react';

// Runs a loader whenever deps change. Returns { data, total, loading, error, reload }.
export function useLoad(loader, deps) {
  const [state, setState] = useState({ data: null, total: 0, loading: true, error: '' });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    loader()
      .then((r) => live && setState({ data: r.data, total: r.total ?? 0, loading: false, error: '' }))
      .catch((e) => live && setState({ data: null, total: 0, loading: false, error: e.message }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
