import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Field from '../components/Field.jsx';
import PageHero from '../components/PageHero.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { getDoctors, getServices, getSlots, createAppointment } from '../lib/api.js';
import { rules, validate, normalizePhone } from '../lib/validation.js';
import { asset, formatDate, formatPrice, nextDays, pluralYears, toISODate, DOW_SHORT, MONTH_SHORT } from '../lib/format.js';

const STEPS = ['Послуга', 'Лікар', 'Дата і час', 'Ваші дані'];
const PET_TYPES = [
  { value: 'cat', label: 'Кіт' },
  { value: 'dog', label: 'Пес' },
  { value: 'other', label: 'Інше' },
];
const OWNER_SCHEMA = {
  ownerName: rules.ownerName,
  phone: rules.phone,
  email: (v) => rules.email(v),
  petName: rules.petName,
  petAge: rules.petAge,
};
const EMPTY_OWNER = { ownerName: '', phone: '', email: '', petName: '', petType: 'cat', petAge: '', comment: '' };

export default function Booking() {
  useDocumentMeta(
    'Запис на прийом — ВетДім',
    'Онлайн-запис до ветеринара: оберіть послугу, лікаря, дату й вільний час. Підтвердження одразу.',
  );
  const [params] = useSearchParams();
  const catalog = useFetch(() => Promise.all([getServices(), getDoctors()]), []);
  const [services, doctors] = catalog.data ?? [[], []];

  // ---- Стан форми ----
  const [serviceId, setServiceId] = useState(Number(params.get('service')) || null);
  const [doctorId, setDoctorId] = useState(Number(params.get('doctor')) || null);
  const [pickedDate, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [owner, setOwner] = useState(EMPTY_OWNER);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(serviceId && doctorId ? 3 : serviceId ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState(null);

  const service = services.find((s) => s.id === serviceId);
  const doctor = doctors.find((d) => d.id === doctorId);

  // Показуємо лише сумісні пари «послуга — лікар»
  const availableServices = useMemo(
    () => services.filter((s) => !doctor || doctor.serviceIds.includes(s.id)),
    [services, doctor],
  );
  const availableDoctors = useMemo(
    () => doctors.filter((d) => !serviceId || d.serviceIds.includes(serviceId)),
    [doctors, serviceId],
  );

  // ---- Дати: 14 днів, неробочі дні лікаря вимкнені ----
  const days = useMemo(() => nextDays(14), []);
  // Якщо дату ще не обрано — підставляємо перший робочий день лікаря
  const firstWorkDay = doctor && days.find((d) => doctor.workDays.includes(d.getDay()));
  const date = pickedDate ?? (firstWorkDay ? toISODate(firstWorkDay) : null);

  // ---- Слоти з API: GET /api/doctors/:id/slots?date= ----
  const slots = useFetch(
    () => (doctorId && date ? getSlots(doctorId, date) : Promise.resolve([])),
    [doctorId, date],
  );

  // ---- Фокус на заголовку кроку (доступність) ----
  const legendRefs = useRef([]);
  const formRef = useRef(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    legendRefs.current[step - 1]?.focus({ preventScroll: true });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  // ---- Обробники ----
  function chooseService(id) {
    setServiceId(id);
    if (doctor && !doctor.serviceIds.includes(id)) setDoctorId(null);
    setErrors((e) => ({ ...e, serviceId: '' }));
  }

  function chooseDoctor(id) {
    setDoctorId(id);
    setDate(null);
    setTime(null);
    setErrors((e) => ({ ...e, doctorId: '' }));
  }

  function chooseDate(iso) {
    setDate(iso);
    setTime(null);
  }

  function onOwnerChange(e) {
    const { name, value } = e.target;
    setOwner((o) => ({ ...o, [name]: value }));
    if (errors[name] && OWNER_SCHEMA[name]) setErrors((er) => ({ ...er, [name]: OWNER_SCHEMA[name](value) }));
  }

  function onOwnerBlur(e) {
    const { name, value } = e.target;
    if (OWNER_SCHEMA[name]) setErrors((er) => ({ ...er, [name]: OWNER_SCHEMA[name](value) }));
  }

  function validateStep(n) {
    if (n === 1 && !serviceId) return setErrors((e) => ({ ...e, serviceId: 'Оберіть послугу' })), false;
    if (n === 2 && !doctorId) return setErrors((e) => ({ ...e, doctorId: 'Оберіть лікаря' })), false;
    if (n === 3 && (!date || !time)) return setErrors((e) => ({ ...e, time: 'Оберіть дату і вільний час' })), false;
    if (n === 4) {
      const found = validate(owner, OWNER_SCHEMA);
      setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(OWNER_SCHEMA).map((k) => [k, found[k] ?? ''])) }));
      const first = Object.keys(found)[0];
      if (first) {
        document.getElementById(first)?.focus();
        return false;
      }
    }
    return true;
  }

  function next() {
    if (validateStep(step)) {
      setServerError('');
      setStep((s) => s + 1);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    for (let n = 1; n <= 4; n++) {
      if (!validateStep(n)) {
        setStep(n);
        return;
      }
    }
    setSubmitting(true);
    setServerError('');
    try {
      const appointment = await createAppointment({
        serviceId,
        doctorId,
        date,
        time,
        ownerName: owner.ownerName.trim(),
        phone: normalizePhone(owner.phone),
        email: owner.email.trim(),
        petName: owner.petName.trim(),
        petType: owner.petType,
        petAge: owner.petAge === '' ? null : Number(owner.petAge),
        comment: owner.comment.trim(),
      });
      setResult(appointment);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerError(err.message);
      if (err.fields) setErrors((e) => ({ ...e, ...err.fields }));
      if (err.status === 409) {
        // Слот щойно зайняли — повертаємо на вибір часу й оновлюємо слоти
        setTime(null);
        setStep(3);
        slots.reload();
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Рендер ----
  if (catalog.loading) {
    return (
      <>
        <PageHero title="Запис на прийом" lead="Чотири простих кроки — і ми чекаємо на вас." compact />
        {/* Скелетон займає місце майбутньої форми — сторінка не «стрибає» (CLS) */}
        <div className="container section--tight" aria-busy="true">
          <div className="skeleton" style={{ minHeight: '70vh' }} />
        </div>
      </>
    );
  }

  if (catalog.error) {
    return (
      <>
        <PageHero title="Запис на прийом" compact />
        <div className="container section--tight">
          <div className="empty" role="alert">
            <p><strong>{catalog.error.message}</strong></p>
            <button className="btn btn--secondary" type="button" onClick={catalog.reload}>Спробувати ще раз</button>
          </div>
        </div>
      </>
    );
  }

  if (result) return <Success appointment={result} service={service} doctor={doctor} />;

  const stepState = (i) => (i + 1 < step ? 'done' : i + 1 === step ? 'current' : 'upcoming');
  const legendProps = (i) => ({ className: 'form-step__title', tabIndex: -1, ref: (el) => {
      legendRefs.current[i] = el;
    },
  });

  return (
    <>
      <PageHero title="Запис на прийом" lead="Чотири простих кроки — і ми чекаємо на вас." compact />
      <section className="section section--tight">
        <div className="container booking">
          <form className="booking__form card" ref={formRef} onSubmit={onSubmit} noValidate>
            <ol className="stepper">
              {STEPS.map((label, i) => (
                <li key={label} className="stepper__item" data-state={stepState(i)} aria-current={i + 1 === step ? 'step' : undefined}>
                  <span>{i + 1} <span className="stepper__label">{label}</span></span>
                </li>
              ))}
            </ol>

            {step === 1 && (
              <fieldset className="form-step is-active">
                <legend {...legendProps(0)}>Оберіть послугу</legend>
                <div className="options booking-options">
                  {availableServices.map((s) => (
                    <label className="option" key={s.id}>
                      <input type="radio" name="serviceId" value={s.id} checked={serviceId === s.id} onChange={() => chooseService(s.id)} />
                      <span className="option__body">
                        <span className="option__title">{s.name}</span>
                        <span className="option__meta">{s.category} · {s.duration} хв</span>
                      </span>
                      <span className="option__price">від {formatPrice(s.price)}</span>
                    </label>
                  ))}
                </div>
                <p className="field__error" role="alert">{errors.serviceId}</p>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="form-step is-active">
                <legend {...legendProps(1)}>Оберіть лікаря</legend>
                <div className="options booking-options">
                  {availableDoctors.map((d) => (
                    <label className="option" key={d.id}>
                      <input type="radio" name="doctorId" value={d.id} checked={doctorId === d.id} onChange={() => chooseDoctor(d.id)} />
                      <img className="option__avatar" src={asset(d.photo)} alt="" width="48" height="48" />
                      <span className="option__body">
                        <span className="option__title">{d.name}</span>
                        <span className="option__meta">{d.specialty} · стаж {d.experience} {pluralYears(d.experience)}</span>
                      </span>
                      <span className="rating"><Icon name="star" />{d.rating.toFixed(1)}</span>
                    </label>
                  ))}
                </div>
                <p className="field__error" role="alert">{errors.doctorId}</p>
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className="form-step is-active">
                <legend {...legendProps(2)}>Оберіть дату і час</legend>
                <h2 className="form-step__subtitle">Дата</h2>
                <div className="dates" role="group" aria-label="Дата прийому">
                  {days.map((d) => {
                    const iso = toISODate(d);
                    const works = doctor?.workDays.includes(d.getDay());
                    return (
                      <button
                        key={iso}
                        className="date"
                        type="button"
                        aria-pressed={iso === date}
                        disabled={!works}
                        aria-label={`${formatDate(iso)}${works ? '' : ' — лікар не приймає'}`}
                        onClick={() => chooseDate(iso)}
                      >
                        <span className="date__dow">{DOW_SHORT[d.getDay()]}</span>
                        <span className="date__day">{d.getDate()}</span>
                        <span className="date__month">{MONTH_SHORT[d.getMonth()]}</span>
                      </button>
                    );
                  })}
                </div>
                <h2 className="form-step__subtitle">Вільний час</h2>
                <div className="slots" role="group" aria-label="Час прийому" aria-busy={slots.loading}>
                  {slots.loading && <p className="muted">Завантажуємо розклад…</p>}
                  {slots.error && <p className="field__error">{slots.error.message}</p>}
                  {!slots.loading && !slots.error && slots.data?.length === 0 && (
                    <p className="muted">На цю дату вільного часу немає.</p>
                  )}
                  {!slots.loading &&
                    slots.data?.map((s) => (
                      <button
                        key={s.time}
                        className="slot"
                        type="button"
                        disabled={!s.available}
                        aria-pressed={s.time === time}
                        aria-label={s.available ? s.time : `${s.time} — зайнято`}
                        onClick={() => {
                          setTime(s.time);
                          setErrors((e) => ({ ...e, time: '' }));
                        }}
                      >
                        {s.time}
                      </button>
                    ))}
                </div>
                <p className="field__error" role="alert">{errors.time}</p>
              </fieldset>
            )}

            {step === 4 && (
              <fieldset className="form-step is-active">
                <legend {...legendProps(3)}>Ваші дані</legend>
                <div className="form-grid">
                  <Field id="ownerName" label="Ваше ім'я" required autoComplete="name" maxLength={60}
                    value={owner.ownerName} onChange={onOwnerChange} onBlur={onOwnerBlur} error={errors.ownerName} />
                  <Field id="phone" label="Телефон" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+380XXXXXXXXX"
                    hint="Ми надішлемо SMS-нагадування за день до візиту."
                    value={owner.phone} onChange={onOwnerChange} onBlur={onOwnerBlur} error={errors.phone} />
                  <Field id="email" label="Email" type="email" autoComplete="email" placeholder="name@example.com"
                    value={owner.email} onChange={onOwnerChange} onBlur={onOwnerBlur} error={errors.email} />
                  <Field id="petName" label="Кличка тварини" required maxLength={40}
                    value={owner.petName} onChange={onOwnerChange} onBlur={onOwnerBlur} error={errors.petName} />
                  <fieldset className="options options--inline form-grid__full">
                    <legend>Вид тварини <span className="req" aria-hidden="true">*</span></legend>
                    {PET_TYPES.map((p) => (
                      <label className="option" key={p.value}>
                        <input type="radio" name="petType" value={p.value} checked={owner.petType === p.value} onChange={onOwnerChange} />
                        <span className="option__title">{p.label}</span>
                      </label>
                    ))}
                  </fieldset>
                  <Field id="petAge" label="Вік тварини (років)" type="number" min="0" max="30" step="0.5" inputMode="decimal"
                    value={owner.petAge} onChange={onOwnerChange} onBlur={onOwnerBlur} error={errors.petAge} />
                  <Field id="comment" as="textarea" label="Що турбує? (необов'язково)" className="form-grid__full" maxLength={500}
                    placeholder="Наприклад: кіт погано їсть уже 2 дні" value={owner.comment} onChange={onOwnerChange} />
                </div>
              </fieldset>
            )}

            {serverError && (
              <div className="alert alert--error" role="alert" id="form-alert">
                <Icon name="alert" />
                <p>{serverError}</p>
              </div>
            )}

            <div className="booking__nav">
              {step > 1 && (
                <button className="btn btn--ghost" type="button" onClick={() => setStep((s) => s - 1)}>
                  <Icon name="arrow-left" />
                  Назад
                </button>
              )}
              {step < 4 ? (
                <button className="btn btn--primary" type="button" onClick={next}>
                  Далі <Icon name="arrow-right" />
                </button>
              ) : (
                <button className="btn btn--primary" type="submit" disabled={submitting}>
                  <Icon name="check" />
                  {submitting ? 'Зберігаємо…' : 'Підтвердити запис'}
                </button>
              )}
            </div>
          </form>

          <aside className="booking__summary card" aria-labelledby="summary-title">
            <div className="card__body">
              <h2 id="summary-title" className="booking__summary-title">
                <Icon name="paw" className="icon icon--sm" />
                Ваш запис
              </h2>
              <dl className="summary" aria-live="polite">
                <div><dt>Послуга</dt><dd>{service?.name ?? '—'}</dd></div>
                <div><dt>Лікар</dt><dd>{doctor?.name ?? '—'}</dd></div>
                <div><dt>Дата</dt><dd>{date ? formatDate(date) : '—'}</dd></div>
                <div><dt>Час</dt><dd>{time ?? '—'}</dd></div>
                <div className="summary__total"><dt>Вартість</dt><dd>{service ? `від ${formatPrice(service.price)}` : '—'}</dd></div>
              </dl>
              <p className="muted summary__note">
                <Icon name="shield" className="icon icon--sm" />
                Безкоштовне скасування до 2 годин до візиту.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Success({ appointment, service, doctor }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <section className="section">
      <div className="container">
        <div className="booking__success card" ref={ref} tabIndex={-1} aria-labelledby="success-title">
          <div className="card__body text-center">
            <span className="success-icon"><Icon name="check" /></span>
            <h1 id="success-title">Запис №{appointment.number} створено!</h1>
            <p className="muted">
              Ми чекаємо на <strong>{appointment.petName}</strong>. Нагадування надійде на {appointment.phone}.
            </p>
            <dl className="summary summary--center">
              <div><dt>Послуга</dt><dd>{service?.name}</dd></div>
              <div><dt>Лікар</dt><dd>{doctor?.name}</dd></div>
              <div><dt>Дата і час</dt><dd>{formatDate(appointment.date)}, {appointment.time}</dd></div>
              <div><dt>Адреса</dt><dd>м. Київ, вул. Садова, 12</dd></div>
            </dl>
            <div className="hero__actions hero__actions--center">
              <Link className="btn btn--primary" to="/">На головну</Link>
              <a className="btn btn--secondary" href={`${import.meta.env.BASE_URL}booking`}>Новий запис</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
