import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import Field from '../components/Field.jsx';
import PageHero from '../components/PageHero.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { rules, validate } from '../lib/validation.js';
import { sendFeedback } from '../lib/api.js';

const MAP_URL = 'https://maps.google.com/?q=Київ,+вул.+Садова,+12';
const SCHEMA = { name: rules.ownerName, email: (v) => rules.email(v, { required: true }), message: rules.message };
const EMPTY = { name: '', email: '', message: '' };

export default function Contacts() {
  useDocumentMeta(
    'Контакти — ВетДім',
    'Адреса, телефон і графік роботи ветеринарної клініки ВетДім у Києві. Напишіть нам — відповімо протягом дня.',
  );
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [serverError, setServerError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    // Після першої помилки перевіряємо поле одразу під час введення
    if (errors[name]) setErrors((er) => ({ ...er, [name]: SCHEMA[name](value) }));
  };
  const onBlur = (e) => setErrors((er) => ({ ...er, [e.target.name]: SCHEMA[e.target.name](e.target.value) }));

  async function onSubmit(e) {
    e.preventDefault();
    const found = validate(values, SCHEMA);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setStatus('sending');
    try {
      await sendFeedback(values);
      setStatus('sent');
      setValues(EMPTY);
    } catch (err) {
      setErrors(err.fields ?? {});
      setServerError(err.message);
      setStatus('error');
    }
  }

  return (
    <>
      <PageHero title="Контакти" lead="Приходьте, телефонуйте або пишіть — ми завжди раді вам і вашим улюбленцям." />
      <section className="section section--tight">
        <div className="container contacts">
          <div className="contacts__info">
            <ul className="contact-cards">
              <li className="contact-card">
                <span className="feature__icon"><Icon name="pin" /></span>
                <div><h2>Адреса</h2><p>м. Київ, вул. Садова, 12<br />5 хв від метро «Лук'янівська»</p></div>
              </li>
              <li className="contact-card">
                <span className="feature__icon"><Icon name="phone" /></span>
                <div><h2>Телефон</h2><p><a href="tel:+380441234567">+38 (044) 123-45-67</a><br />Екстрено — цілодобово</p></div>
              </li>
              <li className="contact-card">
                <span className="feature__icon"><Icon name="mail" /></span>
                <div><h2>Email</h2><p><a href="mailto:hello@vetdim.ua">hello@vetdim.ua</a><br />Відповідаємо протягом дня</p></div>
              </li>
              <li className="contact-card">
                <span className="feature__icon"><Icon name="clock" /></span>
                <div><h2>Графік</h2><p>Пн–Пт 09:00–20:00<br />Сб 10:00–18:00, Нд — вихідний</p></div>
              </li>
            </ul>
            <a className="map" href={MAP_URL} rel="noopener" aria-label="Відкрити розташування клініки на Google Maps">
              <span className="map__pin"><Icon name="pin" /></span>
              <span className="map__label">Відкрити на карті <Icon name="arrow-right" className="icon icon--sm" /></span>
            </a>
          </div>

          <form className="card contact-form" onSubmit={onSubmit} noValidate>
            <div className="card__body">
              <h2>Напишіть нам</h2>
              <p className="muted">Поставте питання лікарю чи залиште відгук.</p>
              <Field id="name" label="Ім'я" required autoComplete="name" value={values.name} onChange={onChange} onBlur={onBlur} error={errors.name} />
              <Field id="email" label="Email" required type="email" autoComplete="email" value={values.email} onChange={onChange} onBlur={onBlur} error={errors.email} />
              <Field id="message" as="textarea" label="Повідомлення" required maxLength={1000} value={values.message} onChange={onChange} onBlur={onBlur} error={errors.message} />
              {status === 'sent' && (
                <div className="alert alert--success" role="status"><Icon name="check-circle" /><p>Дякуємо! Ми відповімо найближчим часом.</p></div>
              )}
              {status === 'error' && (
                <div className="alert alert--error" role="alert"><Icon name="alert" /><p>{serverError}</p></div>
              )}
              <button className="btn btn--primary btn--block" type="submit" disabled={status === 'sending'}>
                <Icon name="mail" />
                {status === 'sending' ? 'Надсилаємо…' : 'Надіслати'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
