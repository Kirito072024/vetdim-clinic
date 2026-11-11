import { useCallback, useEffect, useState } from 'react';

/**
 * Завантажує дані асинхронною функцією й повертає { data, error, loading, reload }.
 * deps — залежності: при їх зміні запит повторюється.
 * Прапорець cancelled захищає від «гонки» відповідей, коли старий запит приходить пізніше нового.
 */
export function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
