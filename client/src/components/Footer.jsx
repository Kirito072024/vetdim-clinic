import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Logo } from './Header.jsx';

const YEAR = new Date().getFullYear();
const MAP_URL = 'https://maps.google.com/?q=Київ,+вул.+Садова,+12';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Logo />
          <p>Ветеринарна клініка, де вашого улюбленця зустрічають як вдома. Турбота, досвід і сучасна медицина.</p>
          <ul className="socials">
            <li>
              <a className="icon-btn" href="https://www.instagram.com/" aria-label="Instagram" rel="noopener">
                <Icon name="instagram" />
              </a>
            </li>
            <li>
              <a className="icon-btn" href="https://www.facebook.com/" aria-label="Facebook" rel="noopener">
                <Icon name="facebook" />
              </a>
            </li>
          </ul>
        </div>
        <nav aria-label="Навігація у футері">
          <h2 className="site-footer__title">Сайт</h2>
          <ul className="site-footer__list">
            <li><Link to="/doctors">Лікарі</Link></li>
            <li><Link to="/services">Послуги</Link></li>
            <li><Link to="/booking">Запис на прийом</Link></li>
            <li><Link to="/contacts">Контакти</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="site-footer__title">Контакти</h2>
          <address className="site-footer__list">
            <a href={MAP_URL} rel="noopener"><Icon name="pin" />м. Київ, вул. Садова, 12</a>
            <a href="tel:+380441234567"><Icon name="phone" />+38 (044) 123-45-67</a>
            <a href="mailto:hello@vetdim.ua"><Icon name="mail" />hello@vetdim.ua</a>
          </address>
        </div>
        <div>
          <h2 className="site-footer__title">Графік роботи</h2>
          <dl className="hours">
            <div><dt>Пн–Пт</dt><dd>09:00–20:00</dd></div>
            <div><dt>Сб</dt><dd>10:00–18:00</dd></div>
            <div><dt>Нд</dt><dd>вихідний</dd></div>
          </dl>
          <p className="site-footer__emergency"><Icon name="heart" />Екстрена допомога — цілодобово за телефоном</p>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <p>© {YEAR} ВетДім. Навчальний проєкт.</p>
        <p><a href="https://github.com/Kirito072024/vetdim-clinic" rel="noopener">GitHub</a></p>
      </div>
    </footer>
  );
}
