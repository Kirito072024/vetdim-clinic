import { Link } from 'react-router-dom';

/** Заголовок внутрішньої сторінки з хлібними крихтами */
export default function PageHero({ title, lead, crumbs = [], compact = false }) {
  return (
    <section className={`page-hero${compact ? ' page-hero--compact' : ''}`} aria-labelledby="page-title">
      <div className="container">
        <Breadcrumbs items={[...crumbs, { label: title }]} />
        <h1 id="page-title">{title}</h1>
        {lead && <p className="page-hero__lead">{lead}</p>}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items, className = 'breadcrumbs' }) {
  return (
    <nav className={className} aria-label="Хлібні крихти">
      <ol>
        <li>
          <Link to="/">Головна</Link>
        </li>
        {items.map((item, i) => (
          <li key={i}>{item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
