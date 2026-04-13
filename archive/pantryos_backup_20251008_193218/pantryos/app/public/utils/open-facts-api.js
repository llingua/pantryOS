/* Open Facts API Integration */
(function () {
  'use strict';

  const API_ENDPOINTS = {
    openFoodFacts: 'https://world.openfoodfacts.org/api/v3/product',
    openBeautyFacts: 'https://world.openbeautyfacts.org/api/v3/product',
    openProductFacts: 'https://world.openproductfacts.org/api/v3/product'
  };

  // Lingue supportate dalle API Open Facts
  const SUPPORTED_LANGUAGES = {
    'it': 'italiano',
    'en': 'english',
    'fr': 'français',
    'de': 'deutsch',
    'es': 'español',
    'pt': 'português',
    'nl': 'nederlands',
    'pl': 'polski',
    'ru': 'русский',
    'ja': '日本語',
    'zh': '中文',
    'ar': 'العربية'
  };

  // Mappatura culture codes a country codes per Open Facts
  const COUNTRY_MAPPING = {
    'it': 'it',
    'en': 'us',
    'en_GB': 'gb',
    'fr': 'fr',
    'de': 'de',
    'es': 'es',
    'pt': 'pt',
    'pt_BR': 'br',
    'pt_PT': 'pt',
    'nl': 'nl',
    'pl': 'pl',
    'ru': 'ru',
    'ja': 'jp',
    'zh_CN': 'cn',
    'zh_TW': 'tw',
    'ar': 'sa',
    'ca': 'es', // Catalano -> Spagna
    'cs': 'cz', // Ceco -> Repubblica Ceca
    'da': 'dk', // Danese -> Danimarca
    'el_GR': 'gr', // Greco -> Grecia
    'et': 'ee', // Estone -> Estonia
    'fi': 'fi', // Finlandese -> Finlandia
    'he_IL': 'il', // Ebraico -> Israele
    'hu': 'hu', // Ungherese -> Ungheria
    'ko_KR': 'kr', // Coreano -> Corea del Sud
    'lt': 'lt', // Lituano -> Lituania
    'no': 'no', // Norvegese -> Norvegia
    'ro': 'ro', // Rumeno -> Romania
    'sk_SK': 'sk', // Slovacco -> Slovacchia
    'sl': 'si', // Sloveno -> Slovenia
    'sv_SE': 'se', // Svedese -> Svezia
    'ta': 'in', // Tamil -> India
    'tr': 'tr', // Turco -> Turchia
    'uk': 'ua'  // Ucraino -> Ucraina
  };

  // Lingua e paese di default (verranno aggiornati dalle configurazioni)
  let currentLanguage = 'it';
  let currentCountry = 'it';
  let configLoaded = false;

  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore
  const cache = new Map();

  // Carica configurazione dall'app
  async function loadAppConfig() {
    if (configLoaded) return;

    try {
      // const response = await fetch('/api/config'); // Disabilitato per evitare 401
      const response = { ok: false }; // Simula errore per usare default
      if (response.ok) {
        const config = await response.json();
        if (config.culture) {
          // Mappa le culture codes di Home Assistant alle lingue Open Facts
          const cultureMapping = {
            'it': 'it',
            'en': 'en',
            'en_GB': 'en',
            'fr': 'fr',
            'de': 'de',
            'es': 'es',
            'pt': 'pt',
            'pt_BR': 'pt',
            'pt_PT': 'pt',
            'nl': 'nl',
            'pl': 'pl',
            'ru': 'ru',
            'ja': 'ja',
            'zh_CN': 'zh',
            'zh_TW': 'zh',
            'ar': 'ar',
            'ca': 'es', // Catalano -> Spagnolo
            'cs': 'en', // Ceco -> Inglese (non supportato)
            'da': 'en', // Danese -> Inglese (non supportato)
            'el_GR': 'en', // Greco -> Inglese (non supportato)
            'et': 'en', // Estone -> Inglese (non supportato)
            'fi': 'en', // Finlandese -> Inglese (non supportato)
            'he_IL': 'en', // Ebraico -> Inglese (non supportato)
            'hu': 'en', // Ungherese -> Inglese (non supportato)
            'ko_KR': 'en', // Coreano -> Inglese (non supportato)
            'lt': 'en', // Lituano -> Inglese (non supportato)
            'no': 'en', // Norvegese -> Inglese (non supportato)
            'ro': 'en', // Rumeno -> Inglese (non supportato)
            'sk_SK': 'en', // Slovacco -> Inglese (non supportato)
            'sl': 'en', // Sloveno -> Inglese (non supportato)
            'sv_SE': 'en', // Svedese -> Inglese (non supportato)
            'ta': 'en', // Tamil -> Inglese (non supportato)
            'tr': 'en', // Turco -> Inglese (non supportato)
            'uk': 'en'  // Ucraino -> Inglese (non supportato)
          };

          const mappedLanguage = cultureMapping[config.culture] || 'en';
          const mappedCountry = COUNTRY_MAPPING[config.culture] || 'us';

          if (mappedLanguage !== currentLanguage) {
            currentLanguage = mappedLanguage;
            console.log(`🌍 Lingua aggiornata da configurazione: ${config.culture} -> ${currentLanguage} (${SUPPORTED_LANGUAGES[currentLanguage]})`);
          }

          if (mappedCountry !== currentCountry) {
            currentCountry = mappedCountry;
            console.log(`🏳️ Paese aggiornato da configurazione: ${config.culture} -> ${currentCountry}`);
          }
        }
        configLoaded = true;
      }
    } catch (error) {
      console.warn('⚠️ Impossibile caricare configurazione app, uso lingua di default:', error.message);
    }
  }

  function getCachedData(barcode) {
    const cached = cache.get(barcode);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  function setCachedData(barcode, data) {
    cache.set(barcode, {
      data,
      timestamp: Date.now()
    });
  }

  async function fetchProductData(barcode, apiName, endpoint) {
    try {
      console.log(`🔍 Cercando in ${apiName} per barcode: ${barcode} (lingua: ${currentLanguage}, paese: ${currentCountry})`);

      // Costruisci URL per API v3 con parametri di localizzazione
      const url = `${endpoint}/${barcode}?product_type=all&cc=${currentCountry}&lc=${currentLanguage}&tags_lc=${currentLanguage}&knowledge_panels_included=health_card%2C+environment_card&knowledge_panels_excluded=health_card%2C+environment_card`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': `${currentLanguage},en;q=0.9`,
          'User-Agent': 'PantryOS/1.0 (https://github.com/your-repo/pantryos)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // API v3 restituisce i dati in un oggetto 'product' se trovato
      if (data && data.product) {
        console.log(`✅ Trovato in ${apiName}:`, data.product.product_name || data.product.name);
        return {
          source: apiName,
          barcode: barcode,
          data: data.product
        };
      } else if (data && data.status === 0) {
        console.log(`❌ Prodotto non trovato in ${apiName}`);
        return null;
      } else {
        console.log(`❌ Errore risposta API ${apiName}:`, data);
        return null;
      }
    } catch (error) {
      console.error(`❌ Errore ${apiName}:`, error.message);
      return null;
    }
  }

  function normalizeProductData(rawData) {
    const product = rawData.data;
    const lang = currentLanguage;

    return {
      // Informazioni base (API v3 usa campi diversi)
      name: product[`product_name_${lang}`] || product.product_name || product.name || '',
      description: product[`generic_name_${lang}`] || product.generic_name || product.description || '',
      brand: product.brands || product.brand || '',
      categories: product[`categories_${lang}`] || product.categories || product.categories_tags?.join(', ') || '',

      // Immagini (API v3 usa campi diversi)
      imageUrl: product.image_url || product.image_front_url || product.images?.front?.display?.url || '',
      imageSmallUrl: product.image_small_url || product.image_front_small_url || product.images?.front?.small?.url || '',

      // Informazioni nutrizionali
      nutritionGrade: product.nutrition_grade_fr || product.nutrition_grades || product.nutrition?.grade || '',
      energy: product.energy_value || product.energy || product.nutrition?.energy_value || '',
      energyUnit: product.energy_unit || product.nutrition?.energy_unit || 'kcal',

      // Ingredienti (priorità alla lingua selezionata)
      ingredients: product[`ingredients_text_${lang}`] || product.ingredients_text || product.ingredients_text_en || product.ingredients?.map(i => i.text).join(', ') || '',
      allergens: product.allergens || product.allergens_tags?.join(', ') || '',
      traces: product.traces || product.traces_tags?.join(', ') || '',

      // Informazioni packaging
      packaging: product.packaging || product.packaging_tags?.join(', ') || '',
      packagingTags: product.packaging_tags || [],

      // Informazioni generali
      quantity: product.quantity || product.quantity_value || '',
      servingSize: product.serving_size || product.serving_quantity || '',
      countries: product.countries || product.countries_tags?.join(', ') || '',
      labels: product.labels || product.labels_tags?.join(', ') || '',

      // Informazioni tecniche
      ecoscore: product.ecoscore_grade || product.ecoscore?.grade || '',
      novaGroup: product.nova_group || product.nova?.group || '',

      // URL e fonti
      url: product.url || product.link || '',
      source: rawData.source,
      lastModified: product.last_modified_t || product.last_modified || null,

      // Informazioni di localizzazione
      language: currentLanguage,
      languageName: SUPPORTED_LANGUAGES[currentLanguage] || currentLanguage,

      // Dati grezzi per debug
      rawData: product
    };
  }

  async function searchProductByBarcode(barcode) {
    if (!barcode || typeof barcode !== 'string') {
      throw new Error('Barcode non valido');
    }

    // Carica configurazione se non ancora fatto
    await loadAppConfig();

    // Controlla cache
    const cached = getCachedData(barcode);
    if (cached) {
      console.log('📦 Dati trovati in cache');
      return cached;
    }

    console.log(`🔍 Ricerca prodotto per barcode: ${barcode}`);

    // Prova le API in ordine di priorità
    const apis = [
      { name: 'Open Food Facts', endpoint: API_ENDPOINTS.openFoodFacts },
      { name: 'Open Beauty Facts', endpoint: API_ENDPOINTS.openBeautyFacts },
      { name: 'Open Product Facts', endpoint: API_ENDPOINTS.openProductFacts }
    ];

    for (const api of apis) {
      try {
        const result = await fetchProductData(barcode, api.name, api.endpoint);
        if (result) {
          const normalizedData = normalizeProductData(result);

          // Salva in cache
          setCachedData(barcode, normalizedData);

          return normalizedData;
        }
      } catch (error) {
        console.warn(`⚠️ Errore con ${api.name}:`, error.message);
        continue;
      }
    }

    throw new Error('Prodotto non trovato in nessuna delle API Open Facts');
  }

  function getProductSuggestions(partialName, limit = 5) {
    // Implementazione semplificata per suggerimenti
    // In una versione completa, potresti usare l'API di ricerca di Open Food Facts
    return [];
  }

  function formatNutritionInfo(productData) {
    if (!productData.rawData) return '';

    const nutrition = productData.rawData.nutriments || {};
    const info = [];

    if (nutrition.energy_100g) {
      info.push(`Energia: ${nutrition.energy_100g} ${nutrition.energy_unit || 'kcal'}/100g`);
    }
    if (nutrition.fat_100g) {
      info.push(`Grassi: ${nutrition.fat_100g}g/100g`);
    }
    if (nutrition.carbohydrates_100g) {
      info.push(`Carboidrati: ${nutrition.carbohydrates_100g}g/100g`);
    }
    if (nutrition.proteins_100g) {
      info.push(`Proteine: ${nutrition.proteins_100g}g/100g`);
    }
    if (nutrition.salt_100g) {
      info.push(`Sale: ${nutrition.salt_100g}g/100g`);
    }

    return info.join(' • ');
  }

  // API pubblica
  window.OpenFactsAPI = {
    searchProductByBarcode,
    getProductSuggestions,
    formatNutritionInfo,

    // Gestione lingua
    setLanguage: (lang) => {
      if (SUPPORTED_LANGUAGES[lang]) {
        currentLanguage = lang;
        configLoaded = true; // Marca come configurato manualmente
        console.log(`🌍 Lingua cambiata manualmente a: ${SUPPORTED_LANGUAGES[lang]} (${lang})`);
        return true;
      } else {
        console.warn(`⚠️ Lingua non supportata: ${lang}`);
        return false;
      }
    },

    getLanguage: () => currentLanguage,

    getSupportedLanguages: () => SUPPORTED_LANGUAGES,

    // Gestione paese
    setCountry: (country) => {
      if (Object.values(COUNTRY_MAPPING).includes(country)) {
        currentCountry = country;
        configLoaded = true; // Marca come configurato manualmente
        console.log(`🏳️ Paese cambiato manualmente a: ${country}`);
        return true;
      } else {
        console.warn(`⚠️ Paese non supportato: ${country}`);
        return false;
      }
    },

    getCountry: () => currentCountry,

    getSupportedCountries: () => COUNTRY_MAPPING,

    // Forza ricaricamento configurazione
    reloadConfig: async () => {
      configLoaded = false;
      await loadAppConfig();
    },

    // Utility per debug
    getCacheInfo: () => ({
      size: cache.size,
      entries: Array.from(cache.keys()),
      currentLanguage: currentLanguage,
      currentCountry: currentCountry
    }),

    clearCache: () => cache.clear(),

    // Costanti
    SOURCES: {
      OPEN_FOOD_FACTS: 'Open Food Facts',
      OPEN_BEAUTY_FACTS: 'Open Beauty Facts',
      OPEN_PRODUCT_FACTS: 'Open Product Facts'
    }
  };
})();
