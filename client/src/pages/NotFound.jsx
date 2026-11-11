import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';

export default function NotFound() {
  useDocumentMeta('Сторінку не знайдено — ВетДім', 'Сторінку не знайдено. Поверніться на головну сторінку ветеринарної клініки ВетДім.');
  return (
    <section className="section not-found">
      <div className="container text-center">
        <p className="not-found__code" aria-hidden="true">
          4<Icon name="paw" className="icon not-found__paw" />4
        </p>
        <h1>Ой, цей слід нікуди не веде</h1>
        <p className="page-hero__lead">Схоже, сторінку перенесли або її ніколи не існувало. Але наш пес уже шукає!</p>
        <div className="hero__actions hero__actions--center">
          <Link className="btn btn--primary btn--lg" to="/">На головну</Link>
          <Link className="btn btn--secondary btn--lg" to="/doctors">Наші лікарі</Link>
        </div>
      </div>
    </section>
  );
}
