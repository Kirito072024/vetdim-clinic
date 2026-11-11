import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Breadcrumbs } from '../components/PageHero.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { getDoctor, getServices } from '../lib/api.js';
import { asset, formatPrice, pluralYears, DOW_SHORT } from '../lib/format.js';

const WEEK = [1, 2, 3, 4, 5, 6, 0];

export default function Doctor() {
  const { id } = useParams();
  const { data, error, loading, reload } = useFetch(() => Promise.all([getDoctor(id), getServices()]), [id]);
  const [doctor, services] = data ?? [];

  useDocumentMeta(
    doctor ? `${doctor.name} — ${doctor.specialty} | ВетДім` : 'Лікар — ВетДім',
    doctor && `${doctor.name}, ${doctor.specialty.toLowerCase()} ветеринарної клініки ВетДім. Досвід, послуги, графік прийому та онлайн-запис.`,
  );

  if (loading) {
    return (
      <div className="container doctor" aria-busy="true">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section">
        <div className="empty" role="alert">
          <h1>{error.status === 404 ? 'Лікаря не знайдено' : 'Не вдалося завантажити дані'}</h1>
          <p>{error.message}</p>
          {error.status === 404 ? (
            <Link className="btn btn--primary" to="/doctors">До списку лікарів</Link>
          ) : (
            <button className="btn btn--primary" type="button" onClick={reload}>Спробувати ще раз</button>
          )}
        </div>
      </div>
    );
  }

  const doctorServices = doctor.serviceIds.map((sid) => services.find((s) => s.id === sid)).filter(Boolean);

  return (
    <div className="container">
      <Breadcrumbs className="breadcrumbs breadcrumbs--page" items={[{ label: 'Лікарі', to: '/doctors' }, { label: doctor.name }]} />
      <article className="doctor">
        <div className="doctor__photo">
          <img src={asset(doctor.photo)} alt={`Портрет: ${doctor.name}`} width="400" height="300" />
        </div>
        <div className="doctor__info">
          <span className="badge">{doctor.specialty}</span>
          <h1>{doctor.name}</h1>
          <ul className="doctor__facts">
            <li><Icon name="award" /><span>Стаж <strong>{doctor.experience} {pluralYears(doctor.experience)}</strong></span></li>
            <li><Icon name="star" className="icon icon--star" /><span>Рейтинг <strong>{doctor.rating.toFixed(1)}</strong></span></li>
            <li><Icon name="graduation" /><span>{doctor.education}</span></li>
          </ul>
          <p className="doctor__bio">{doctor.bio}</p>

          <section className="doctor__block" aria-labelledby="doc-services">
            <h2 id="doc-services">Послуги лікаря</h2>
            <ul className="service-list">
              {doctorServices.map((s) => (
                <li key={s.id}>
                  <Link to={`/booking?service=${s.id}&doctor=${doctor.id}`}>{s.name}</Link>
                  <span className="service-list__price">від {formatPrice(s.price)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="doctor__block" aria-labelledby="doc-schedule">
            <h2 id="doc-schedule">Графік прийому</h2>
            <ul className="week">
              {WEEK.map((n) => {
                const on = doctor.workDays.includes(n);
                return (
                  <li key={n} className={`week__day${on ? ' is-active' : ''}`}>
                    <abbr title={on ? 'Приймає' : 'Не приймає'}>{DOW_SHORT[n]}</abbr>
                  </li>
                );
              })}
            </ul>
            <p className="muted">Час прийому: 09:00–18:00</p>
          </section>

          <div className="doctor__cta">
            <Link className="btn btn--primary btn--lg btn--block" to={`/booking?doctor=${doctor.id}`}>
              <Icon name="calendar" />
              Записатися до лікаря
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
