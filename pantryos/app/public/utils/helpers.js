/* Helper Functions */
(function () {
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function displayUnitLabel(units, unitId) {
    if (!unitId) return '';
    const match = units.find((unit) => unit.id === unitId);
    return match ? match.name : '';
  }

  function createInitialForm(fields) {
    const state = {};
    fields.forEach((field) => {
      if (field.type === 'checkbox') state[field.key] = false;
      else state[field.key] = '';
    });
    return state;
  }

  function populateForm(fields, item) {
    const state = {};
    fields.forEach((field) => {
      if (field.type === 'checkbox') state[field.key] = Boolean(item[field.key]);
      else state[field.key] = item[field.key] ?? '';
    });
    return state;
  }

  function buildPayload(fields, form) {
    const payload = {};
    fields.forEach((field) => {
      if (field.type === 'checkbox') payload[field.key] = Boolean(form[field.key]);
      else payload[field.key] = form[field.key];
    });
    return payload;
  }

  window.PantryOSHelpers = {
    capitalize,
    displayUnitLabel,
    createInitialForm,
    populateForm,
    buildPayload,
  };
})();
