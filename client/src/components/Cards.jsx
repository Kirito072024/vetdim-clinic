import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { asset, formatPrice, pluralYears } from '../lib/format.js';

export function DoctorCard({ doctor, headingLevel: H = 'h2', eager = false }) {
  return (
    <article className="card card--hover doctor-card">
      <div className="doctor-card__photo">
        <img src={asset(doctor.photo)} alt="" width="400" height="300" loading={eager ? 'eager' : 'lazy'} />
      </div>
      <div className="card__body">
        <span className="badge">{doctor.specialty}</span>
        <H className="card__title">
          <Link to={`/doctors/${doctor.id}`}>{doctor.name}</Link>
        </H>
        <div className="card__meta">
          <span>
            Стаж {doctor.experience} {pluralYears(doctor.experience)}
          </span>
          <span className="rating">
            <Icon name="star" />
            {doctor.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ServiceCard({ service, headingLevel: H = 'h2' }) {
  return (
    <article className="card card--hover service-card">
      <div className="card__body">
        <div className="service-card__icon">
          <Icon name={service.icon} />
        </div>
        <p className="card__meta">
          <span>{service.category}</span>
          <span>
            <Icon name="clock" className="icon icon--sm" />
            {service.duration} хв
          </span>
        </p>
        <H className="card__title">{service.name}</H>
        <p className="muted service-card__text">{service.description}</p>
        <div className="card__footer">
          <p className="price">
            <small>від</small> {formatPrice(service.price)}
          </p>
          <Link className="btn btn--secondary" to={`/booking?service=${service.id}`} aria-label={`Записатися: ${service.name}`}>
            Записатися
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Скелетони під час завантаження */
export function CardSkeletons({ count = 3 }) {
  return Array.from({ length: count }, (_, i) => (
    <li key={i} aria-hidden="true">
      <div className="skeleton" />
    </li>
  ));
}

/** Стан помилки з кнопкою повтору */
export function ErrorState({ error, onRetry }) {
  return (
    <li className="empty" role="alert">
      <p>
        <strong>{error?.message ?? 'Щось пішло не так'}</strong>
      </p>
      {onRetry && (
        <button className="btn btn--secondary" type="button" onClick={onRetry}>
          Спробувати ще раз
        </button>
      )}
    </li>
  );
}
