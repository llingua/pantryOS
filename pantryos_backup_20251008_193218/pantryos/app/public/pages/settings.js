/* global React */
(function () {
  const { useEffect, useState } = React;
  const h = React.createElement;

  function SettingsPage({ api, appData, notify }) {
    const [form, setForm] = useState({ ...appData.config });

    useEffect(() => {
      setForm({ ...appData.config });
    }, [appData.config]);

    const handleSubmit = async (event) => {
      event.preventDefault();
      await notify(() => api.updateConfig(form), 'Impostazioni salvate');
    };

    return h(
      'div',
      { className: 'page' },
      h('section', { className: 'page-section' },
        h('h2', null, 'Impostazioni'),
        h('p', { className: 'section-subtitle' }, 'Configura lingua, valuta e timezone per PantryOS.'),
        h(
          'form',
          { className: 'form-grid card', onSubmit: handleSubmit },
          h('input', {
            placeholder: 'Lingua (es. it-IT)',
            value: form.culture || '',
            onChange: (event) => setForm((state) => ({ ...state, culture: event.target.value })),
          }),
          h('input', {
            placeholder: 'Valuta (es. EUR)',
            value: form.currency || '',
            onChange: (event) => setForm((state) => ({ ...state, currency: event.target.value })),
          }),
          h('input', {
            placeholder: 'Timezone (es. Europe/Rome)',
            value: form.timezone || '',
            onChange: (event) => setForm((state) => ({ ...state, timezone: event.target.value })),
          }),
          h('select', {
            value: form.logLevel || 'info',
            onChange: (event) => setForm((state) => ({ ...state, logLevel: event.target.value })),
          },
            ['trace', 'debug', 'info', 'notice', 'warning', 'error', 'fatal'].map((level) => h('option', { key: level, value: level }, level))
          ),
          h('button', { type: 'submit', className: 'btn primary' }, 'Salva impostazioni')
        )
      )
    );
  }

  window.PantryOSPages = window.PantryOSPages || {};
  window.PantryOSPages.SettingsPage = SettingsPage;
})();
