/* global React */
(function () {
  const h = React.createElement;

  const NAV_GROUPS = [
    { id: 'overview', label: 'Navigazione' },
    { id: 'manage', label: 'Gestisci dati' },
    { id: 'system', label: 'Sistema' },
  ];

  const ROUTES = [
    { id: 'dashboard', label: 'Riepilogo della dispensa', group: 'overview', icon: '📊' },
    { id: 'inventory', label: 'Inventario', group: 'overview', icon: '📦' },
    { id: 'shopping', label: 'Lista della spesa', group: 'overview', icon: '🛒' },
    { id: 'manage-products', label: 'Prodotti', group: 'manage', icon: '📦' },
    { id: 'manage-locations', label: 'Posizioni', group: 'manage', icon: '📍' },
    { id: 'manage-shops', label: 'Negozi', group: 'manage', icon: '🏬' },
    { id: 'manage-units', label: 'Unità di misura', group: 'manage', icon: '⚖️' },
    { id: 'manage-groups', label: 'Gruppi di prodotti', group: 'manage', icon: '🗂️' },
    { id: 'settings', label: 'Impostazioni', group: 'system', icon: '⚙️' },
  ];

  function Sidebar({ route, onRouteChange }) {
    return h(
      'aside',
      { className: 'app-sidebar' },
      h('div', { className: 'sidebar-logo' }, h('span', null, '🍱'), h('strong', null, 'PantryOS')),
      NAV_GROUPS.map((group) =>
        h(
          'div',
          { key: group.id, className: 'sidebar-group' },
          h('p', { className: 'sidebar-group-label' }, group.label),
          h(
            'ul',
            { className: 'sidebar-list' },
            ROUTES.filter((item) => item.group === group.id).map((item) =>
              h(
                'li',
                { key: item.id },
                h(
                  'button',
                  {
                    type: 'button',
                    className: `sidebar-item${route === item.id ? ' active' : ''}`,
                    onClick: () => onRouteChange(item.id),
                  },
                  item.icon ? h('span', { className: 'sidebar-icon' }, item.icon) : null,
                  h('span', null, item.label)
                )
              )
            )
          )
        )
      )
    );
  }

  window.PantryOSComponents = window.PantryOSComponents || {};
  window.PantryOSComponents.Sidebar = Sidebar;
  window.PantryOSComponents.ROUTES = ROUTES;
})();
