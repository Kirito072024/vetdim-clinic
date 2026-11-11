import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { DoctorCard, ServiceCard, CardSkeletons, ErrorState } from '../components/Cards.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { getDoctors, getServices } from '../lib/api.js';
import { asset } from '../lib/format.js';

const FEATURES = [
  { icon: 'award', title: 'Досвідчені лікарі', text: 'Шість фахівців різних напрямів зі стажем до 15 років і постійним навчанням.' },
  { icon: 'microscope', title: 'Власна лабораторія', text: 'Аналізи крові, УЗД та діагностика — результати в день звернення.' },
  { icon: 'calendar', title: 'Онлайн-запис 24/7', text: 'Обирайте лікаря і вільний час будь-коли, навіть уночі.' },
  { icon: 'heart', title: 'Без стресу', text: 'Окремі зони очікування для котів і собак, спокійні огляди та смаколики.' },
];

const STEPS = [
  { title: 'Оберіть послугу', text: 'Огляд, щеплення, чистка зубів чи операція — ціни відомі заздалегідь.' },
  { title: 'Оберіть лікаря і час', text: 'Бачите лише вільні слоти потрібного фахівця на найближчі два тижні.' },
  { title: 'Приходьте на прийом', text: 'Ми чекаємо на вас і вашого улюбленця — без черги, точно в призначений час.' },
];

const POPULAR_IDS = [2, 1, 7, 4];

export default function Home() {
  useDocumentMeta(
    'ВетДім — ветеринарна клініка у Києві | Онлайн-запис до лікаря',
    'Ветеринарна клініка ВетДім: терапія, хірургія, стоматологія, вакцинація. Запишіть кота чи собаку до обраного лікаря онлайн за 2 хвилини.',
  );
  const doctors = useFetch(() => getDoctors(), []);
  const services = useFetch(() => getServices(), []);
  const popular = services.data && POPULAR_IDS.map((id) => services.data.find((s) => s.id === id)).filter(Boolean);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="badge badge--accent hero__badge">
              <Icon name="paw" className="icon icon--sm" />
              Ветеринарна клініка у Києві
            </p>
            <h1 id="hero-title">
              Турбота про вашого улюбленця — <span className="text-gradient">запис онлайн</span> за 2 хвилини
            </h1>
            <p className="hero__lead">
              Оберіть лікаря, зручний день і час — без дзвінків і черг. Досвідчені ветеринари, сучасне обладнання та тепле
              ставлення до кожного пацієнта.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--primary btn--lg" to="/booking">
                Записатися на прийом <Icon name="arrow-right" />
              </Link>
              <Link className="btn btn--secondary btn--lg" to="/doctors">
                Наші лікарі
              </Link>
            </div>
            <dl className="stats">
              <div><dt>Років досвіду</dt><dd>15+</dd></div>
              <div><dt>Щасливих пацієнтів</dt><dd>12 000+</dd></div>
              <div><dt>Середня оцінка</dt><dd>4.9 <Icon name="star" className="icon icon--star" /></dd></div>
            </dl>
          </div>
          <div className="hero__media">
            <img src={asset('img/hero.svg')} alt="Усміхнені пес і кіт" width="560" height="480" fetchPriority="high" />
            <div className="float-card float-card--top" aria-hidden="true">
              <span className="float-card__icon"><Icon name="check" /></span>
              <span><strong>Запис підтверджено</strong><small>Сьогодні, 18:30</small></span>
            </div>
            <div className="float-card float-card--bottom" aria-hidden="true">
              <span className="float-card__icon float-card__icon--accent"><Icon name="heart" /></span>
              <span><strong>Без черг і стресу</strong><small>Fear Free підхід</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="why-title">
        <div className="container">
          <header className="section__header">
            <p className="eyebrow">Чому ВетДім</p>
            <h2 id="why-title">Все для здоров'я вашого улюбленця</h2>
          </header>
          <ul className="features">
            {FEATURES.map((f) => (
              <li className="feature" key={f.title}>
                <span className="feature__icon"><Icon name={f.icon} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="services-title">
        <div className="container">
          <header className="section__header section__header--row">
            <div>
              <p className="eyebrow">Послуги</p>
              <h2 id="services-title">Популярні послуги</h2>
            </div>
            <Link className="link-arrow" to="/services">Усі послуги <Icon name="arrow-right" /></Link>
          </header>
          <ul className="grid grid--4">
            {services.loading && <CardSkeletons count={4} />}
            {services.error && <ErrorState error={services.error} onRetry={services.reload} />}
            {popular?.map((s) => (
              <li key={s.id}><ServiceCard service={s} headingLevel="h3" /></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="steps-title">
        <div className="container">
          <header className="section__header text-center">
            <p className="eyebrow">Як це працює</p>
            <h2 id="steps-title">Запис у три кроки</h2>
          </header>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li className="step" key={s.title}>
                <span className="step__num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="doctors-title">
        <div className="container">
          <header className="section__header section__header--row">
            <div>
              <p className="eyebrow">Команда</p>
              <h2 id="doctors-title">Наші лікарі</h2>
            </div>
            <Link className="link-arrow" to="/doctors">Усі лікарі <Icon name="arrow-right" /></Link>
          </header>
          <ul className="grid grid--3">
            {doctors.loading && <CardSkeletons count={3} />}
            {doctors.error && <ErrorState error={doctors.error} onRetry={doctors.reload} />}
            {doctors.data?.slice(0, 3).map((d) => (
              <li key={d.id}><DoctorCard doctor={d} headingLevel="h3" /></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2 id="cta-title">Улюбленцю потрібна допомога?</h2>
              <p>Запишіться онлайн або зателефонуйте — підкажемо, до якого лікаря звернутися.</p>
            </div>
            <div className="cta-band__actions">
              <Link className="btn btn--light btn--lg" to="/booking">Записатися онлайн</Link>
              <a className="btn btn--outline-light btn--lg" href="tel:+380441234567"><Icon name="phone" />Зателефонувати</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
