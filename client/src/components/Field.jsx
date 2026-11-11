/** Поле форми з підписом, підказкою та повідомленням про помилку (доступне для скрінрідерів) */
export default function Field({ id, label, required, hint, error, as = 'input', className = '', ...props }) {
  const Control = as;
  const describedBy = [hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(' ');
  const controlClass = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input';
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label} {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      <Control
        className={controlClass}
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <p className="field__error" id={`${id}-error`}>
        {error}
      </p>
    </div>
  );
}
