import { useEffect } from 'react';

const TONE = {
  active: 'green', approved: 'green', filled: 'green', buy: 'green', deposit: 'blue',
  pending: 'amber', open: 'blue',
  blocked: 'red', rejected: 'red', cancelled: 'gray', disabled: 'gray', sell: 'red', withdrawal: 'amber',
};
export function Badge({ children, tone }) {
  const t = tone || TONE[String(children).toLowerCase()] || 'gray';
  return <span className={`badge badge-${t}`}>{children}</span>;
}

export function Pnl({ value, children }) {
  return <span className={value >= 0 ? 'pos' : 'neg'}>{children}</span>;
}

export function Pager({ page, total, limit, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="pager">
      <span className="muted">{total} result{total === 1 ? '' : 's'}</span>
      <div className="row">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span className="muted">Page {page} of {pages}</span>
        <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(([k, label]) => (
        <button key={k} className={k === value ? 'tab active' : 'tab'} onClick={() => onChange(k)}>{label}</button>
      ))}
    </div>
  );
}

export function Empty({ loading, error, children = 'Nothing to show.' }) {
  if (loading) return <div className="state">Loading...</div>;
  if (error) return <div className="state err">{error}</div>;
  return <div className="state">{children}</div>;
}

export function Modal({ title, onClose, children, footer, side }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={side ? 'modal side' : 'modal'} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ title, message, confirmLabel, danger, busy, error, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} footer={<>
      <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
    </>}>
      <p>{message}</p>
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
