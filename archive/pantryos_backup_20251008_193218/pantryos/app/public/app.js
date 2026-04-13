/* global React, ReactDOM, PantryOSAPI, PantryOSComponents, PantryOSPages */
(function () {
  const { useCallback, useEffect, useMemo, useState } = React;
  const h = React.createElement;
  const { createApi } = PantryOSAPI;
  const { Sidebar, ROUTES } = PantryOSComponents;
  const {
    DashboardPage,
    InventoryPage,
    ShoppingListPage,
    ManageProductsPage,
    ManageLocationsPage,
    ManageShopsPage,
    ManageUnitsPage,
    ManageGroupsPage,
    SettingsPage,
  } = PantryOSPages;

  const ROUTE_LABEL = ROUTES.reduce((acc, route) => {
    acc[route.id] = route.label;
    return acc;
  }, {});

  function App() {
    const api = useMemo(createApi, []);
    const [route, setRoute] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [appData, setAppData] = useState({
      state: { items: [], shoppingList: [] },
      config: { culture: 'it', currency: 'EUR', timezone: 'Europe/Rome', logLevel: 'info' },
      summary: { items: 0, shoppingList: 0 },
    });

    const refresh = useCallback(async () => {
      try {
        setLoading(true);
        const data = await api.getState();
        setAppData(data);
      } catch (err) {
        console.error('Unable to load application state', err);
        setError('Impossibile caricare i dati. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    }, [api]);

    useEffect(() => {
      refresh();
    }, [refresh]);

    const notify = useCallback(
      async (operation, successMessage) => {
        try {
          setError('');
          const result = await operation();
          if (successMessage) {
            setMessage(successMessage);
            window.setTimeout(() => setMessage(''), 4000);
          }
          await refresh();
          return result ?? true;
        } catch (err) {
          console.error('Operation failed', err);
          setMessage('');
          setError(err.message || 'Operazione non riuscita');
          window.setTimeout(() => setError(''), 5000);
          return false;
        }
      },
      [refresh]
    );

    if (loading) {
      return h('div', { className: 'loading-screen' }, h('div', { className: 'loading-spinner' }), h('p', null, 'Caricamento PantryOS...'));
    }

    return h(
      AppShell,
      {
        route,
        onRouteChange: setRoute,
        title: ROUTE_LABEL[route] || 'PantryOS',
        message,
        error,
      },
      h(RouterView, {
        route,
        api,
        appData,
        notify,
      })
    );
  }

  function AppShell({ route, onRouteChange, title, message, error, children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = useCallback(() => {
      setIsMobileMenuOpen(prev => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
      setIsMobileMenuOpen(false);
    }, []);

    return h(
      'div',
      { className: 'app-shell' },
      isMobileMenuOpen ? h('div', {
        className: 'mobile-menu-overlay active',
        onClick: closeMobileMenu
      }) : null,
      h(Sidebar, {
        route,
        onRouteChange,
        isMobileOpen: isMobileMenuOpen,
        onMobileClose: closeMobileMenu
      }),
      h(
        'div',
        { className: 'app-main-area' },
        h('header', { className: 'app-header' },
          h('button', {
            className: 'mobile-menu-toggle',
            onClick: toggleMobileMenu,
            'aria-label': 'Apri menu'
          }, h('i', { className: 'ti ti-menu-2' })),
          h('h1', null, title)
        ),
        error ? h(StatusBanner, { type: 'error', message: error }) : null,
        message ? h(StatusBanner, { type: 'success', message }) : null,
        h('main', { className: 'app-main' }, children)
      )
    );
  }

  function StatusBanner({ type, message }) {
    return h('div', { className: `status-banner ${type}` }, message);
  }

  function RouterView({ route, api, appData, notify }) {
    const props = { api, appData, notify };
    switch (route) {
      case 'inventory':
        return h(InventoryPage, props);
      case 'shopping':
        return h(ShoppingListPage, props);
      case 'manage-products':
        return h(ManageProductsPage, props);
      case 'manage-locations':
        return h(ManageLocationsPage, props);
      case 'manage-shops':
        return h(ManageShopsPage, props);
      case 'manage-units':
        return h(ManageUnitsPage, props);
      case 'manage-groups':
        return h(ManageGroupsPage, props);
      case 'settings':
        return h(SettingsPage, props);
      case 'dashboard':
      default:
        return h(DashboardPage, props);
    }
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(h(App));
})();
