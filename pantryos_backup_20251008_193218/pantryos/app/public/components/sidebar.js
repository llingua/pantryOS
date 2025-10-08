/* global React */
(function () {
  const h = React.createElement;

  const NAV_GROUPS = [
    { id: 'overview', label: 'Navigazione' },
    { id: 'manage', label: 'Gestisci dati' },
    { id: 'system', label: 'Sistema' },
  ];

  const ROUTES = [
    { id: 'dashboard', label: 'Riepilogo della dispensa', group: 'overview', icon: 'ti ti-chart-bar' },
    { id: 'inventory', label: 'Inventario', group: 'overview', icon: 'ti ti-package' },
    { id: 'shopping', label: 'Lista della spesa', group: 'overview', icon: 'ti ti-shopping-cart' },
    { id: 'manage-products', label: 'Prodotti', group: 'manage', icon: 'ti ti-box' },
    { id: 'manage-locations', label: 'Posizioni', group: 'manage', icon: 'ti ti-map-pin' },
    { id: 'manage-shops', label: 'Negozi', group: 'manage', icon: 'ti ti-building-store' },
    { id: 'manage-units', label: 'Unità di misura', group: 'manage', icon: 'ti ti-ruler-measure' },
    { id: 'manage-groups', label: 'Gruppi di prodotti', group: 'manage', icon: 'ti ti-folders' },
    { id: 'settings', label: 'Impostazioni', group: 'system', icon: 'ti ti-settings' },
  ];

  function Sidebar({ route, onRouteChange, isMobileOpen, onMobileClose }) {
    const handleRouteClick = (itemId) => {
      onRouteChange(itemId);
      if (onMobileClose) {
        onMobileClose();
      }
    };

    return h(
      'aside',
      { className: `app-sidebar${isMobileOpen ? ' mobile-open' : ''}` },
      h('div', { className: 'sidebar-logo' },
        h('i', { className: 'ti ti-basket sidebar-logo-icon' }),
        h('strong', null, 'PantryOS')
      ),
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
                    onClick: () => handleRouteClick(item.id),
                  },
                  item.icon ? h('i', { className: `sidebar-icon ${item.icon}` }) : null,
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
