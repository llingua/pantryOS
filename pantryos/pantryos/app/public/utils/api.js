/* API Client */
(function () {
  const basePath = (() => {
    const { pathname } = window.location;
    if (!pathname || pathname === '/') return '';
    if (pathname.endsWith('/index.html')) return pathname.replace(/\/index\.html$/, '');
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  })();

  async function apiFetch(path, options = {}) {
    const response = await fetch(`${basePath}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'same-origin',
      ...options,
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const payload = JSON.parse(text);
        throw new Error(payload.error || 'Richiesta non valida');
      } catch (error) {
        throw new Error(text || 'Richiesta non valida');
      }
    }

    if (response.status === 204) return null;
    return response.json();
  }

  function createApi() {
    return {
      getState: () => apiFetch('/api/state'),
      // Inventory
      createItem: (payload) => apiFetch('/api/items', { method: 'POST', body: JSON.stringify(payload) }),
      updateItem: (id, payload) => apiFetch(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
      deleteItem: (id) => apiFetch(`/api/items/${id}`, { method: 'DELETE' }),
      // Shopping list
      createShoppingEntry: (payload) => apiFetch('/api/shopping-list', { method: 'POST', body: JSON.stringify(payload) }),
      updateShoppingEntry: (id, payload) => apiFetch(`/api/shopping-list/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
      deleteShoppingEntry: (id) => apiFetch(`/api/shopping-list/${id}`, { method: 'DELETE' }),
      // Locations
      listLocations: () => apiFetch('/api/locations'),
      createLocation: (payload) => apiFetch('/api/locations', { method: 'POST', body: JSON.stringify(payload) }),
      updateLocation: (id, payload) => apiFetch(`/api/locations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
      deleteLocation: (id) => apiFetch(`/api/locations/${id}`, { method: 'DELETE' }),
      // Product groups
      listProductGroups: () => apiFetch('/api/product-groups'),
      createProductGroup: (payload) => apiFetch('/api/product-groups', { method: 'POST', body: JSON.stringify(payload) }),
      updateProductGroup: (id, payload) => apiFetch(`/api/product-groups/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
      deleteProductGroup: (id) => apiFetch(`/api/product-groups/${id}`, { method: 'DELETE' }),
      // Quantity units
      listQuantityUnits: () => apiFetch('/api/quantity-units'),
      createQuantityUnit: (payload) => apiFetch('/api/quantity-units', { method: 'POST', body: JSON.stringify(payload) }),
      updateQuantityUnit: (id, payload) => apiFetch(`/api/quantity-units/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
      deleteQuantityUnit: (id) => apiFetch(`/api/quantity-units/${id}`, { method: 'DELETE' }),
      // Shopping locations
      listShoppingLocations: () => apiFetch('/api/shopping-locations'),
      createShoppingLocation: (payload) => apiFetch('/api/shopping-locations', { method: 'POST', body: JSON.stringify(payload) }),
      updateShoppingLocation: (id, payload) => apiFetch(`/api/shopping-locations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
      deleteShoppingLocation: (id) => apiFetch(`/api/shopping-locations/${id}`, { method: 'DELETE' }),
      // Products
      listProducts: () => apiFetch('/api/products'),
      createProduct: (payload) => apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
      updateProduct: (id, payload) => apiFetch(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
      deleteProduct: (id) => apiFetch(`/api/products/${id}`, { method: 'DELETE' }),
      // Config
      updateConfig: (payload) => apiFetch('/api/config', { method: 'PATCH', body: JSON.stringify(payload) }),
    };
  }

  window.PantryOSAPI = { createApi };
})();
