/* global React, PantryOSComponents, PantryOSHelpers */
(function () {
  const { useCallback, useEffect, useState } = React;
  const h = React.createElement;
  const { Modal, FormField } = PantryOSComponents;
  const { capitalize, createInitialForm, populateForm, buildPayload } = PantryOSHelpers;

  function renderField(field, form, setForm) {
    if (field.type === 'checkbox') {
      return h(FormField, {
        key: field.key,
        label: field.label,
        children: h('input', {
          type: 'checkbox',
          checked: Boolean(form[field.key]),
          onChange: (event) => setForm((state) => ({ ...state, [field.key]: event.target.checked })),
        })
      });
    }
    if (field.type === 'textarea') {
      return h(FormField, {
        key: field.key,
        label: field.label,
        required: Boolean(field.required),
        children: h('textarea', {
          rows: field.rows || 3,
          placeholder: field.label,
          value: form[field.key],
          onChange: (event) => setForm((state) => ({ ...state, [field.key]: event.target.value })),
        })
      });
    }
    if (field.type === 'select') {
      return h(FormField, {
        key: field.key,
        label: field.label,
        required: Boolean(field.required),
        children: h('select', {
          value: form[field.key],
          onChange: (event) => setForm((state) => ({ ...state, [field.key]: event.target.value })),
        }, field.renderOptions ? field.renderOptions() : null),
      });
    }
    return h(FormField, {
      key: field.key,
      label: field.label,
      required: Boolean(field.required),
      children: h('input', {
        type: field.type || 'text',
        placeholder: field.label,
        value: form[field.key],
        onChange: (event) => setForm((state) => ({ ...state, [field.key]: event.target.value })),
      })
    });
  }

  function GenericManager({ title, subtitle, singularLabel = 'elemento', fields, listFetcher, createEntity, updateEntity, deleteEntity, notify, formatItem, columns }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(createInitialForm(fields));
    const [isModalOpen, setModalOpen] = useState(false);

    const load = useCallback(async () => {
      setLoading(true);
      const data = await listFetcher();
      setItems(data);
      setLoading(false);
    }, [listFetcher]);

    useEffect(() => {
      load();
    }, [load]);

    const openCreateModal = () => {
      setEditing(null);
      setForm(createInitialForm(fields));
      setModalOpen(true);
    };

    const openEditModal = (entity) => {
      setEditing(entity);
      setForm(populateForm(fields, entity));
      setModalOpen(true);
    };

    const closeModal = () => {
      setModalOpen(false);
      setEditing(null);
      setForm(createInitialForm(fields));
    };

    const handleConfirm = async () => {
      const payload = buildPayload(fields, form);
      const action = editing ? () => updateEntity(editing.id, payload) : () => createEntity(payload);
      const messageBase = capitalize(singularLabel);
      const success = await notify(action, editing ? `${messageBase} aggiornato` : `${messageBase} creato`);
      if (success) {
        closeModal();
        load();
      }
    };

    const handleDelete = async (entity) => {
      const success = await notify(() => deleteEntity(entity.id), `${capitalize(singularLabel)} eliminato`);
      if (success) load();
    };

    return h(
      'div',
      { className: 'page' },
      h('section', { className: 'page-section' },
        h('div', { className: 'section-header-row' },
          h('div', null,
            h('h2', null, title),
            subtitle ? h('p', { className: 'section-subtitle' }, subtitle) : null
          ),
          h('button', { className: 'btn primary', onClick: openCreateModal }, `Aggiungi ${singularLabel}`)
        )
      ),
      h('section', { className: 'page-section' },
        loading
          ? h('p', null, 'Caricamento...')
          : items.length === 0
            ? h('p', { className: 'muted' }, 'Nessun elemento ancora presente.')
            : h('div', { className: 'table' },
                h('div', { className: 'table-header' }, columns.map((column) => h('span', { key: column }, column)), h('span', null, 'Azioni')),
                items.map((item) => h('div', { key: item.id, className: 'table-row' },
                  formatItem(item).map((cell, index) => h('span', { key: index }, cell || '—')),
                  h('span', { className: 'table-actions' },
                    h('button', { className: 'btn ghost btn-sm', onClick: () => openEditModal(item) }, 'Modifica'),
                    h('button', { className: 'btn danger btn-sm', onClick: () => handleDelete(item) }, 'Elimina')
                  )
                ))
              )
      ),
      h(Modal, {
        open: isModalOpen,
        title: editing ? `Modifica ${singularLabel}` : `Nuovo ${singularLabel}`,
        confirmLabel: editing ? 'Salva modifiche' : 'Crea',
        onClose: closeModal,
        onConfirm: handleConfirm,
      },
        h('div', { className: 'form-grid' }, fields.map((field) => renderField(field, form, setForm)))
      )
    );
  }

  window.PantryOSComponents = window.PantryOSComponents || {};
  window.PantryOSComponents.GenericManager = GenericManager;
})();
