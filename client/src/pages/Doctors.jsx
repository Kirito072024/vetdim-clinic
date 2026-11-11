import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import { DoctorCard, CardSkeletons, ErrorState } from '../components/Cards.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { getDoctors } from '../lib/api.js';

const SPECIALTIES = ['Терапевт', 'Хірург', 'Дерматолог', 'Стоматолог', 'Офтальмолог'];

export default function Doctors() {
  useDocumentMeta(
    'Лікарі — ВетДім',
    'Команда ветеринарних лікарів клініки ВетДім: терапевти, хірург, дерматолог, стоматолог, офтальмолог. Оберіть свого лікаря та запишіться онлайн.',
  );
  // Фільтр зберігається в URL (?specialty=...), тож посиланням можна поділитися
  const [params, setParams] = useSearchParams();
  const specialty = params.get('specialty') ?? '';
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  // Усі лікарі завантажуються один раз, пошук і фільтр працюють на клієнті миттєво
  const { data, error, loading, reload } = useFetch(() => getDoctors(), []);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return (data ?? []).filter((d) => (!specialty || d.specialty === specialty) && (!q || d.name.toLowerCase().includes(q)));
  }, [data, specialty, deferredQuery]);

  const setSpecialty = (value) => setParams(value ? { specialty: value } : {}, { replace: true });

  return (
    <>
      <PageHero title="Наші лікарі" lead="Шість фахівців, які знають, як зробити візит спокійним для вас і вашого улюбленця." />
      <section className="section section--tight" aria-label="Каталог лікарів">
        <div className="container">
          <div className="toolbar">
            <div className="search">
              <label className="visually-hidden" htmlFor="doctor-search">Пошук лікаря за ім'ям</label>
              <Icon name="search" className="icon search__icon" />
              <input
                className="input search__input"
                id="doctor-search"
                type="search"
                placeholder="Пошук за ім'ям"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="chips" role="group" aria-label="Фільтр за спеціалізацією">
              {['', ...SPECIALTIES].map((s) => (
                <button key={s || 'all'} className="chip" type="button" aria-pressed={specialty === s} onClick={() => setSpecialty(s)}>
                  {s || 'Усі'}
                </button>
              ))}
            </div>
          </div>
          <p className="results-count muted" aria-live="polite">
            {!loading && !error && `Знайдено лікарів: ${filtered.length}`}
          </p>
          <ul className="grid grid--3">
            {loading && <CardSkeletons count={6} />}
            {error && <ErrorState error={error} onRetry={reload} />}
            {!loading && !error && filtered.length === 0 && (
              <li className="empty"><p>За вашим запитом лікарів не знайдено. Спробуйте змінити фільтр.</p></li>
            )}
            {filtered.map((d, i) => (
              <li key={d.id}><DoctorCard doctor={d} eager={i < 3} /></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
