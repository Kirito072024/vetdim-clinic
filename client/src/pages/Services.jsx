import { useSearchParams } from 'react-router-dom';
import PageHero from '../components/PageHero.jsx';
import { ServiceCard, CardSkeletons, ErrorState } from '../components/Cards.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { getServices } from '../lib/api.js';

const CATEGORIES = ['Терапія', 'Профілактика', 'Хірургія', 'Дерматологія', 'Стоматологія', 'Офтальмологія', 'Діагностика'];

export default function Services() {
  useDocumentMeta(
    'Послуги та ціни — ВетДім',
    'Послуги ветеринарної клініки ВетДім і ціни: огляд, вакцинація, чипування, хірургія, стоматологія, дерматологія, діагностика.',
  );
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  // Фільтрація на сервері: GET /api/services?category=...
  const { data, error, loading, reload } = useFetch(() => getServices({ category }), [category]);

  return (
    <>
      <PageHero
        title="Послуги та ціни"
        lead="Від профілактичного огляду до складних операцій. Остаточна вартість залежить від ваги та стану тварини."
      />
      <section className="section section--tight" aria-label="Каталог послуг">
        <div className="container">
          <div className="chips" role="group" aria-label="Фільтр за категорією">
            {['', ...CATEGORIES].map((c) => (
              <button
                key={c || 'all'}
                className="chip"
                type="button"
                aria-pressed={category === c}
                onClick={() => setParams(c ? { category: c } : {}, { replace: true })}
              >
                {c || 'Усі'}
              </button>
            ))}
          </div>
          <ul className="grid grid--3 services-grid">
            {loading && <CardSkeletons count={6} />}
            {error && <ErrorState error={error} onRetry={reload} />}
            {!loading && data?.map((s) => <li key={s.id}><ServiceCard service={s} /></li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
