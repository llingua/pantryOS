/* global React, PantryOSComponents */
(function () {
  const h = React.createElement;
  const { GenericManager } = PantryOSComponents;

  function ManageLocationsPage({ api, notify }) {
    return h(GenericManager, {
      title: 'Posizioni',
      subtitle: 'Gestisci le posizioni della dispensa',
      singularLabel: 'posizione',
      fields: [
        { key: 'name', label: 'Nome', required: true },
        { key: 'description', label: 'Descrizione' },
        { key: 'isFreezer', label: 'È un freezer', type: 'checkbox' },
      ],
      listFetcher: api.listLocations,
      createEntity: api.createLocation,
      updateEntity: api.updateLocation,
      deleteEntity: api.deleteLocation,
      notify,
      formatItem: (item) => [item.name, item.description || '', item.isFreezer ? 'Freezer' : ''],
      columns: ['Nome', 'Descrizione', 'Tipo'],
    });
  }

  function ManageShopsPage({ api, notify }) {
    return h(GenericManager, {
      title: 'Negozi',
      subtitle: 'Dove acquisti i prodotti',
      singularLabel: 'negozio',
      fields: [
        { key: 'name', label: 'Nome', required: true },
        { key: 'description', label: 'Descrizione' },
      ],
      listFetcher: api.listShoppingLocations,
      createEntity: api.createShoppingLocation,
      updateEntity: api.updateShoppingLocation,
      deleteEntity: api.deleteShoppingLocation,
      notify,
      formatItem: (item) => [item.name, item.description || ''],
      columns: ['Nome', 'Descrizione'],
    });
  }

  function ManageUnitsPage({ api, notify }) {
    return h(GenericManager, {
      title: 'Unità di misura',
      subtitle: 'Configura le unità di misura disponibili',
      singularLabel: 'unità di misura',
      fields: [
        { key: 'name', label: 'Nome singolare', required: true },
        { key: 'namePlural', label: 'Nome plurale' },
        { key: 'description', label: 'Descrizione' },
        { key: 'isInteger', label: 'Valore intero', type: 'checkbox' },
      ],
      listFetcher: api.listQuantityUnits,
      createEntity: api.createQuantityUnit,
      updateEntity: api.updateQuantityUnit,
      deleteEntity: api.deleteQuantityUnit,
      notify,
      formatItem: (item) => [item.name, item.namePlural || item.name, item.isInteger ? 'Intero' : 'Decimale'],
      columns: ['Singolare', 'Plurale', 'Tipo'],
    });
  }

  function ManageGroupsPage({ api, notify }) {
    return h(GenericManager, {
      title: 'Gruppi di prodotti',
      subtitle: 'Organizza i prodotti per tipologia',
      singularLabel: 'gruppo di prodotti',
      fields: [
        { key: 'name', label: 'Nome', required: true },
        { key: 'description', label: 'Descrizione' },
      ],
      listFetcher: api.listProductGroups,
      createEntity: api.createProductGroup,
      updateEntity: api.updateProductGroup,
      deleteEntity: api.deleteProductGroup,
      notify,
      formatItem: (item) => [item.name, item.description || ''],
      columns: ['Nome', 'Descrizione'],
    });
  }

  window.PantryOSPages = window.PantryOSPages || {};
  window.PantryOSPages.ManageLocationsPage = ManageLocationsPage;
  window.PantryOSPages.ManageShopsPage = ManageShopsPage;
  window.PantryOSPages.ManageUnitsPage = ManageUnitsPage;
  window.PantryOSPages.ManageGroupsPage = ManageGroupsPage;
})();
