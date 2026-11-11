import { asset } from '../lib/format.js';

/** Іконка зі SVG-спрайту public/img/icons.svg */
export default function Icon({ name, className = 'icon' }) {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`${asset('img/icons.svg')}#i-${name}`} />
    </svg>
  );
}
