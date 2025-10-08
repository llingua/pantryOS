/* global React */
(function () {
  const h = React.createElement;

  function Modal({ open, title, confirmLabel = 'Conferma', onClose, onConfirm, children }) {
    if (!open) return null;
    return h('div', { className: 'modal-backdrop' },
      h('div', { className: 'modal' },
        h('div', { className: 'modal-header' },
          h('h3', null, title),
          h('button', { className: 'modal-close', type: 'button', onClick: onClose }, '×')
        ),
        h('div', { className: 'modal-body' }, children),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn ghost', type: 'button', onClick: onClose }, 'Annulla'),
          h('button', { className: 'btn primary', type: 'button', onClick: onConfirm }, confirmLabel)
        )
      )
    );
  }

  window.PantryOSComponents = window.PantryOSComponents || {};
  window.PantryOSComponents.Modal = Modal;
})();
