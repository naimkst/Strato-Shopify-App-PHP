function initConfigurator() {
  // keep original flow
  initTabs();
  initCartButton();
}

function mapSVGWithoutComments(svg) {
  if (!svg) return;

  const root = svg.querySelector('g');
  if (!root) return;

  let handleCount = 1;
  let outerCount = 1;
  let ventGroup = 1;

  // =============================
  // ✅ HANDLE DETECTION
  // =============================
  root.querySelectorAll('g').forEach(g => {
    const pathCount = g.querySelectorAll('path').length;

    if (g.hasAttribute('transform') && pathCount === 3) {
      g.classList.add('handle_handle');
      g.id = `handle_handle_${handleCount++}`;
    }
  });

  // =============================
  // ✅ ROOT PATHS
  // =============================
  const rootPaths = [...root.children].filter(el => el.tagName === 'path');

  if (rootPaths.length < 4) return;

  // =============================
  // 🔥 DETECT OUTER + VENT USING GEOMETRY
  // =============================

  const outerPaths = [];
  const ventPaths = [];

  rootPaths.forEach(p => {
    const d = p.getAttribute('d') || '';

    // OUTER FRAME → touches 0 or 1000
    if (
      d.includes('1000') ||
      d.includes('0 0') ||
      d.includes('0 1000')
    ) {
      outerPaths.push(p);
    }

    // VENT → inner bevel (has 960 or 40 or 903/97 combo)
    else if (
      d.includes('960') ||
      d.includes('40') ||
      (d.includes('903') && d.includes('97'))
    ) {
      ventPaths.push(p);
    }
  });

  // =============================
  // ✅ APPLY CLASSES
  // =============================

  outerPaths.slice(-4).forEach(p => {
    p.classList.add('outer_frame');
    p.id = `outer_frame_${outerCount++}`;
  });

  ventPaths.slice(-4).forEach((p, i) => {
    p.classList.add('vent');
    p.id = `vent_${ventGroup}_${i + 1}`;
  });
}
function mapCommentsToSVG(svg) {
  if (!svg) return;

  const rootGroup = svg;
  if (!rootGroup) return;

  const usedIds = {}; // normal IDs

  // 🔥 vent-only grouping
  const groupIndexMap = {};
  let globalGroupCounter = 1;

  const nameMap = {
    pfosten: 'mullion',
    aussenrahmen: 'outer_frame',
    glasflaechen: 'infill'
  };

  function cleanString(str) {
    return str
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function getMappedName(base) {

    // handle (unchanged)
    if (base.startsWith('griff')) {
      return 'handle_handle';
    }

    // 🔥 vent (robust match)
    if (
      base.includes('fluegelrahmen') ||
      base.includes('flugelrahmen') ||
      base.includes('gelrahmen')
    ) {
      return 'vent';
    }

	  if (
      base.includes('rechts') ||
      base.includes('links') ||
      base.includes('dreh') ||
	  base.includes('fest') ||
	  base.includes('mitte') ||
	  base.includes('stulp') ||
	  base.includes('kein') ||
	  base.includes('oeffnungslinien')


    ) {
      return 'opening';
    }

    // normal mapping
    if (nameMap[base]) {
      return nameMap[base];
    }

    return base;
  }

  // normal IDs (mullion, outer_frame, handle, etc.)
  function getSimpleId(base) {
    if (!usedIds[base]) {
      usedIds[base] = 1;
    } else {
      usedIds[base]++;
    }
    return `${base}_${usedIds[base]}`;
  }

  // 🔥 vent-only ID logic
  function getVentId(base) {
    if (!groupIndexMap[base]) {
      groupIndexMap[base] = { group: globalGroupCounter++, count: 1 };
    } else {
      groupIndexMap[base].count++;
    }

    const group = groupIndexMap[base].group;
    const count = groupIndexMap[base].count;

    return `vent_${group}_${count}`;
  }

  function processNodes(parent, currentComment = '') {
    parent.childNodes.forEach(node => {

      // read comment
      if (node.nodeType === 8) {
        currentComment = node.nodeValue.trim();
        return;
      }

      // element
      if (node.nodeType === 1) {
        let base = currentComment ? cleanString(currentComment) : '';

        if (base) {

          // 🔥 ALWAYS map (fixes your earlier bug)
          let finalBase = getMappedName(base);

          node.classList.add(finalBase);

          // 🔥 ONLY vent gets special IDs
          if (finalBase === 'vent') {
            node.id = getVentId(base);
          } else {
            node.id = getSimpleId(finalBase);
          }
        }

        // recursion
        if (node.tagName.toLowerCase() === 'g') {
          processNodes(node, currentComment);
        }
      }

    });
  }

  processNodes(rootGroup);
}

function renderSectionedOptions(subtab, container) {
  ////const subtabContainer = document.querySelector('#rollladen-subtab');
  const subtabContainer = container;

  if (!subtabContainer) return;

  const baseGrid = subtabContainer.querySelector('.option-grid');
  if (baseGrid) baseGrid.innerHTML = ''; // clear existing cards

  // Remove old rendered sections
  subtabContainer.querySelectorAll('.section-block').forEach(el => el.remove());

  // --- helper to build cards ---
  const createCard = (opt) => {

    const card = document.createElement('div');
    card.className = 'card-option';
    card.dataset.id = opt.id;
    card.dataset.label = opt.label || opt.value_key;

    const isInlineSvg = typeof opt.image_url === 'string' && opt.image_url.trim().startsWith('<svg');
    const imageMarkup = isInlineSvg
      ? opt.image_url
      : (opt.image_url ? `<img src="${opt.image_url}" alt="${opt.label || ''}">` : '');

    card.innerHTML = `
      ${imageMarkup}
      <div class="card-text">
       ${opt.label || ''}
        ${opt.value_key ? `<span>${opt.value_key}</span>` : ''}
      </div>
      <span class="checkmark-box">
        <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg" alt="">
      </span>
    `;

    card.onclick = () => {
      const siblings = card.parentElement.querySelectorAll('.card-option');
      siblings.forEach(el => el.classList.remove('active'));
      card.classList.add('active');

      windowConfig.selectedOptionId = opt.id;
      windowConfig.selectedOptionLabel = opt.label || opt.value_key;

   updateAllSidebars();
    };

    return card;
  };

  // --- CASE 1: backend sections exist ---
  if (Array.isArray(subtab.sections) && subtab.sections.length > 0) {
    subtab.sections.forEach(section => {
      if (!Array.isArray(section.options) || section.options.length === 0) return;

      // ✅ build section block + safe IDs
      const secBlock = document.createElement('div');
      const safeId = section.name
        ? section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
        : 'section-' + section.id;
      secBlock.className = 'section-block';
//////secBlock.id = 'section-block';
      secBlock.dataset.sectionId = section.id;
      secBlock.id = safeId; // give the section an ID

      // heading with ID
      if (section.name && section.name.trim() !== '') {
        const heading = document.createElement('h4');
        heading.className = 'section-heading';
        heading.textContent = section.name;
        heading.id = safeId + '-title'; // <–– heading also has ID
        secBlock.appendChild(heading);
      }

      const list = document.createElement('div');
      list.className = 'option-grid';
      section.options.forEach(opt => list.appendChild(createCard(opt)));
      secBlock.appendChild(list);

      // put section directly inside the subtab (not nested in .option-grid)
      subtabContainer.appendChild(secBlock);
    });

    return;
  }

  // --- CASE 2: no sections, render normally ---
  if (Array.isArray(subtab.options) && subtab.options.length > 0 && baseGrid) {
    subtab.options.forEach(opt => baseGrid.appendChild(createCard(opt)));
  }
}



function getTabLoader() {
  return document.getElementById('tabLoader');
}

function showLoader() {
  const loader = getTabLoader();
  if (loader) {
    loader.style.display = 'flex';
    loader.setAttribute('aria-hidden', 'false');
  }
}

function hideLoader() {
  const loader = getTabLoader();
  if (loader) {
    loader.style.display = 'none';
    loader.setAttribute('aria-hidden', 'true');
  }
}

// ====== STATIC NAV BUTTONS HANDLING =======
const tabMapcheck = {
  __static_ksf__: 'static-tab-ksf',
  __static_schiebe__: 'static-tab-schiebe',
  __static_balkon__: 'static-tab-balkon'
};
let staticCode = null;
let pendingStaticCode = null;



let basePriceTab4 = 0;   // stores price from Tab 4
let hasVisitedTab5 = false;
//let extraPriceTab5 = 0;  // stores selected option price from Tab 5
let extraPriceTab5Map = {};
let extraPriceTab6Map = {};
let TAB6_SELECTION = {};

const SILL_PROFILE_SUBTAB_ID = '__fensterbankanschlussprofil__';
const SILL_PROFILE_PRICE_KEY = SILL_PROFILE_SUBTAB_ID;
const ROLLLADEN_SYSTEM_SECTION_ID = '__rollladen_system__';
const ROLLLADEN_DRIVE_SECTION_ID = '__rollladen_drive__';
const ROLLLADEN_SYSTEM_IDS = ['324', '325', '327'];
const ROLLLADEN_SYSTEM_DEPENDENCIES = ROLLLADEN_SYSTEM_IDS.join(',');

const SILL_PROFILE_OPTIONS = [
  {
    id: '__none__',
    article: '',
    label: 'Keine Auswahl',
    designation: 'Keine Auswahl',
    profile: '',
    addHeight: 0,
    pricePerMeter: 0
  },
  {
    id: '120209',
    article: '120209',
    label: 'Steinbankanschluss 40 mm',
    designation: 'Steinbankanschluss 40 mm',
    profile: '17 x 40 mm',
    addHeight: 40,
    pricePerMeter: 7.84
  },
  {
    id: '120208',
    article: '120208',
    label: 'Steinbankanschluss 30 mm',
    designation: 'Steinbankanschluss 30 mm',
    profile: '17 x 30 mm',
    addHeight: 30,
    pricePerMeter: 7.19
  },
  {
    id: '120206',
    article: '120206',
    label: 'Steinbankanschluss 25 mm',
    designation: 'Steinbankanschluss 25 mm',
    profile: '16 x 25 mm',
    addHeight: 25,
    pricePerMeter: 6.90
  },
  {
    id: '120102',
    article: '120102',
    label: 'Bankanschlussprofil 50 mm',
    designation: 'Bankanschlussprofil 50 mm',
    profile: '12 x 50 mm',
    addHeight: 50,
    pricePerMeter: 14.95
  },
  {
    id: '120237',
    article: '120237',
    label: 'Bankanschlussprofil 30 mm',
    designation: 'Bankanschlussprofil 30 mm',
    profile: '8 x 30 mm',
    addHeight: 30,
    pricePerMeter: 7.19
  },
  {
    id: '144247',
    article: '144247',
    label: 'Neubau Bankanschlussprofil 30 mm',
    designation: 'Neubau Bankanschlussprofil 30 mm',
    profile: '33.5 x 30 mm',
    addHeight: 30,
    pricePerMeter: 6.90
  }
];

const ORNAMENT_PRICE_BY_LABEL = {
  klarglas: { double: 0, triple: 0 },
  chinchilla: { double: 36.90, triple: 59.90 },
  satinato: { double: 59.90, triple: 69.90 },
  mastercarre: { double: 79.90, triple: 89.90 },
  crepi: { double: 49.90, triple: 65.90 }
};

const VSG_PRICE_BY_LABEL = {
  '6': { double: 55.90, triple: 59.90 },
  '8': { double: 65.90, triple: 85.90 }
};

const ROLLLADEN_DRIVE_OPTIONS = [
  {
    id: '__rollladen_drive_gurt__',
    label: 'Gurt',
    price: '0.00',
    depends_on: ROLLLADEN_SYSTEM_DEPENDENCIES,
    image_url: '',
    option_type: '',
    extra_json: JSON.stringify({
      heading: 'Gurt',
      subheading: ''
    })
  },
  {
    id: '__rollladen_drive_motor__',
    label: 'Motor',
    price: '0.00',
    depends_on: ROLLLADEN_SYSTEM_DEPENDENCIES,
    image_url: '',
    option_type: '',
    extra_json: JSON.stringify({
      heading: 'Motor',
      subheading: ''
    })
  },
  {
    id: '__rollladen_drive_funk__',
    label: 'Funk',
    price: '0.00',
    depends_on: ROLLLADEN_SYSTEM_DEPENDENCIES,
    image_url: '',
    option_type: '',
    extra_json: JSON.stringify({
      heading: 'Funk',
      subheading: ''
    })
  }
];

function normalizeConfigText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasNormalizedText(value, needles) {
  const normalized = normalizeConfigText(value);
  return needles.some(needle => normalized.includes(normalizeConfigText(needle)));
}

function getGlassAreaM2() {
  const width = parseFloat(document.getElementById('width')?.value);
  const height = parseFloat(document.getElementById('height')?.value);
  if (!width || !height) return 0;
  return (width / 1000) * (height / 1000);
}

function calculateAreaSurcharge(ratePerM2) {
  return getGlassAreaM2() * (parseFloat(ratePerM2) || 0);
}

function isTripleGlazingRequired() {
  const profileId = String(getCurrentProfileId?.() || '').trim();
  const profile = `${windowConfig.profile || ''} ${profileId}`;

  return (
    staticCode === '__static_schiebe__' ||
    profileId === '3' ||
    hasNormalizedText(profile, [
      'salamander 82',
      'bluevolution 82',
      'bluevolution 82 md',
      'blu evolution 82',
      'aluplast ideal 8000'
    ])
  );
}

function isTripleGlazingSelected() {
  return isTripleGlazingRequired() ||
    hasNormalizedText(windowConfig.isolierglas, ['3 fach', '3fach', 'triple']);
}

function getGlazingPaneKey() {
  return isTripleGlazingSelected() ? 'triple' : 'double';
}

function getOrnamentPrice(label) {
  const normalized = normalizeConfigText(label);
  let key = null;

  if (normalized.includes('klarglas')) key = 'klarglas';
  else if (normalized.includes('chinchilla')) key = 'chinchilla';
  else if (normalized.includes('satinato')) key = 'satinato';
  else if (normalized.includes('mastercarre')) key = 'mastercarre';
  else if (normalized.includes('crepi')) key = 'crepi';

  if (!key || !ORNAMENT_PRICE_BY_LABEL[key]) return 0;
  return calculateAreaSurcharge(ORNAMENT_PRICE_BY_LABEL[key][getGlazingPaneKey()]);
}

function getVsgPrice(label) {
  const normalized = normalizeConfigText(label);
  const thickness = normalized.includes('8') ? '8' : (normalized.includes('6') ? '6' : null);
  if (!thickness || !VSG_PRICE_BY_LABEL[thickness]) return 0;
  return calculateAreaSurcharge(VSG_PRICE_BY_LABEL[thickness][getGlazingPaneKey()]);
}

function buildKlarglasOption() {
  return {
    id: '__klarglas__',
    tab_id: null,
    subtab_id: '7',
    label: 'Klarglas',
    value_key: 'standard',
    image_url: 'https://droplify.de/deine-fenster24/frontend/img/Klarglas.png',
    price: 0,
    extra_json: '{}'
  };
}

function normalizeOrnamentOptions(options) {
  const list = Array.isArray(options) ? options.slice() : [];
  const hasKlarglas = list.some(opt => hasNormalizedText(opt.label, ['klarglas']));
  if (!hasKlarglas) list.unshift(buildKlarglasOption());

  const order = ['klarglas', 'chinchilla', 'satinato', 'mastercarre', 'crepi'];
  return list
    .filter(opt => order.some(key => {
      const normalized = normalizeConfigText(opt.label);
      return normalized.includes(key);
    }))
    .sort((a, b) => {
      const idx = opt => {
        const normalized = normalizeConfigText(opt.label);
        if (normalized.includes('klarglas')) return 0;
        if (normalized.includes('chinchilla')) return 1;
        if (normalized.includes('satinato')) return 2;
        if (normalized.includes('mastercarre')) return 3;
        if (normalized.includes('crepi')) return 4;
        return 99;
      };
      return idx(a) - idx(b);
    });
}

function getJsonValue(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

function getRollladenSystemLabel(opt) {
  const label = opt?.label || opt?.value_key || '';
  const normalized = normalizeConfigText(label);

  if (String(opt?.id) === '324' || normalized.includes('ras vorbaurollladen')) {
    return 'RAS Vorbaurollladen';
  }

  if (String(opt?.id) === '325' || normalized.includes('rar vorbaurollladen')) {
    return 'RAR Vorbaurollladen';
  }

  if (String(opt?.id) === '327' || normalized.includes('rak vorbau unter putz')) {
    return 'RAK Vorbau unter Putz';
  }

  return label;
}

function buildRollladenSystemOption(source, spec) {
  const opt = {
    ...(source || {}),
    id: spec.id,
    label: spec.label,
    value_key: '',
    section_id: ROLLLADEN_SYSTEM_SECTION_ID,
    depends_on: '',
    option_type: ''
  };
  const extra = getJsonValue(opt.extra_json, {});
  extra.heading = spec.label;
  extra.subheading = '';
  extra.features = [];
  opt.extra_json = JSON.stringify(extra);
  return opt;
}

function normalizeRollladenSubtab(subtab) {
  if (!subtab) return subtab;

  const allOptions = Array.isArray(subtab.options) ? subtab.options : [];
  const findById = id => allOptions.find(opt => String(opt.id) === String(id));
  const systemSpecs = [
    { id: '324', label: 'RAS Vorbaurollladen' },
    { id: '325', label: 'RAR Vorbaurollladen' },
    { id: '327', label: 'RAK Vorbau unter Putz' }
  ];

  const systems = systemSpecs
    .map(spec => {
      const source = findById(spec.id) || allOptions.find(opt => getRollladenSystemLabel(opt) === spec.label);
      return source ? buildRollladenSystemOption(source, spec) : null;
    })
    .filter(Boolean);

  const driveOptions = ROLLLADEN_DRIVE_OPTIONS.map((opt, index) => ({
    ...opt,
    section_id: ROLLLADEN_DRIVE_SECTION_ID,
    extra_json: JSON.stringify({
      ...getJsonValue(opt.extra_json, {}),
      is_default: index === 0
    })
  }));

  subtab.sections = [
    {
      id: ROLLLADEN_SYSTEM_SECTION_ID,
      name: 'System',
      order_index: '1',
      options: systems
    },
    {
      id: ROLLLADEN_DRIVE_SECTION_ID,
      name: 'Antrieb',
      order_index: '2',
      options: driveOptions
    }
  ];

  subtab.options = subtab.sections.flatMap(section => section.options);
  return subtab;
}

function normalizeConfiguratorData(data) {
  if (!data || !Array.isArray(data.tabs)) return data;

  data.tabs.forEach(tab => {
    if (String(tab.id) === '4' && Array.isArray(tab.subtabs)) {
      const beschlagSubtab = tab.subtabs.find(st => hasNormalizedText(st.name, ['beschlag']));
      if (beschlagSubtab && Array.isArray(beschlagSubtab.options)) {
        beschlagSubtab.options = beschlagSubtab.options.filter(opt =>
          !hasNormalizedText(`${opt.label} ${opt.value_key}`, ['rc1', 'rc2', 'wk1', 'wk2'])
        );
      }
    }

    if (String(tab.id) === '5' && Array.isArray(tab.subtabs)) {
      tab.subtabs.forEach(subtab => {
        if (hasNormalizedText(subtab.name, ['ornament'])) {
          subtab.options = normalizeOrnamentOptions(subtab.options);
        }

        if (hasNormalizedText(subtab.name, ['griff']) && Array.isArray(subtab.options)) {
          subtab.options = subtab.options.map(opt => {
            if (hasNormalizedText(opt.label, ['abschliessbar', 'abschlie'])) {
              return { ...opt, price: 28.90 };
            }
            return opt;
          });
        }
      });
    }

    if (String(tab.id) === '6' && Array.isArray(tab.subtabs)) {
      tab.subtabs = tab.subtabs.filter(subtab =>
        !hasNormalizedText(subtab.name, ['sprossen', 'fensterzubehoer'])
      );

      tab.subtabs.forEach(subtab => {
        if (Array.isArray(subtab.sections)) {
          subtab.sections = subtab.sections.filter(section =>
            !hasNormalizedText(section?.name, ['fensterzubehoer'])
          );
        }

        if (hasNormalizedText(subtab.name, ['rollladen'])) {
          normalizeRollladenSubtab(subtab);
        }
      });

      if (!tab.subtabs.some(subtab => String(subtab.id) === SILL_PROFILE_SUBTAB_ID)) {
        const rollladenIndex = tab.subtabs.findIndex(subtab => hasNormalizedText(subtab.name, ['rollladen']));
        const sillSubtab = {
          id: SILL_PROFILE_SUBTAB_ID,
          name: 'FENSTERBANK-ANSCHLUSSPROFIL',
          order_index: '3',
          options: SILL_PROFILE_OPTIONS,
          sections: []
        };

        if (rollladenIndex === -1) tab.subtabs.push(sillSubtab);
        else tab.subtabs.splice(rollladenIndex, 0, sillSubtab);
      }
    }
  });

  return data;
}

function getSelectedSillProfile() {
  return SILL_PROFILE_OPTIONS.find(opt =>
    String(opt.id) === String(windowConfig.fensterbankAnschlussprofilId || '')
  ) || SILL_PROFILE_OPTIONS[0];
}

function parseConfiguratorNumber(value) {
  const normalized = String(value || '').replace(',', '.');
  const number = parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
}

function setSidebarPrice(element, value, emptyText = '—') {
  if (!element) return;
  const normalized = String(value ?? '').replace(',', '.');
  const price = parseFloat(normalized);

  if (!Number.isFinite(price)) {
    element.textContent = emptyText;
    return;
  }

  element.innerHTML = `${price.toFixed(2)} € <span class="price-tax">inkl. MwSt.</span>`;
}

function getCurrentWindowWidthMm() {
  const values = [
    document.getElementById('width')?.value,
    document.getElementById('sb-width')?.textContent,
    document.getElementById('glass-sidebar-width')?.textContent,
    document.getElementById('zubehoer-sidebar-width')?.textContent,
    document.getElementById('t7-sidebar-width')?.textContent
  ];

  for (const value of values) {
    const width = parseConfiguratorNumber(value);
    if (width > 0) return width;
  }

  return 0;
}

function getSillProfilePrice(profile = getSelectedSillProfile()) {
  if (!profile || !profile.pricePerMeter) return 0;
  const width = getCurrentWindowWidthMm();
  if (!width) return 0;
  return (width / 1000) * profile.pricePerMeter;
}

function getSillProfileSummary() {
  const profile = getSelectedSillProfile();
  if (!profile || profile.id === '__none__') return '';

  const width = getCurrentWindowWidthMm();
  const calculatedPrice = getSillProfilePrice(profile);
  const calculatedText = width
    ? `, ${width} mm = ${calculatedPrice.toFixed(2)} €`
    : '';

  return `${profile.article} ${profile.designation} (${profile.profile}, +${profile.addHeight} mm, ${profile.pricePerMeter.toFixed(2)} €/m${calculatedText}, weiß)`;
}

function updateSillProfilePrice() {
  extraPriceTab6Map[SILL_PROFILE_PRICE_KEY] = getSillProfilePrice();
}

function getEffectiveHeightValue() {
  const height = parseInt(document.getElementById('height')?.value, 10);
  if (!Number.isFinite(height) || height <= 0) return '';
  const addHeight = parseInt(windowConfig.fensterbankAddHeight || 0, 10);
  return String(height + (Number.isFinite(addHeight) ? addHeight : 0));
}

function syncEffectiveHeightDisplays() {
  const value = getEffectiveHeightValue();
  if (!value) return;

  [
    'sb-height',
    'glass-sidebar-height',
    'zubehoer-sidebar-height',
    't7-height',
    't7-sidebar-height'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function isBalconyDoorConfiguration() {
  const activeStatic = document.querySelector('.tab-nav-buttons button.active')?.dataset?.code;
  const urlStatic = getUrlParam('tab_check');
  const productParam = getUrlParam('product');
  const selectedStaticCode = windowConfig.staticCode || staticCode || activeStatic || urlStatic;

  if (selectedStaticCode === '__static_balkon__') return true;
  if (staticCode === '__static_balkon__') return true;

  if (activeStatic === '__static_balkon__') return true;

  if (urlStatic === '__static_balkon__') return true;

  const labels = [
    selectedStaticCode,
    productParam,
    window.location.pathname,
    windowConfig.profile,
    windowConfig.wing,
    windowConfig.opening,
    document.getElementById('t7-sidebar-profile')?.textContent,
    document.getElementById('t7-sidebar-wing')?.textContent,
    document.getElementById('t7-sidebar-opening')?.textContent,
    document.getElementById('glass-sidebar-profile')?.textContent,
    document.getElementById('glass-sidebar-wing')?.textContent,
    document.getElementById('glass-sidebar-opening')?.textContent,
    document.getElementById('zubehoer-sidebar-profile')?.textContent,
    document.getElementById('zubehoer-sidebar-wing')?.textContent,
    document.getElementById('zubehoer-sidebar-opening')?.textContent
  ].join(' ');

  return hasNormalizedText(labels, ['balkontuer', 'balkontueren', 'balkon tuer', 'balkon tueren', 'balkon', 'balcony']);
}

function getBalconyDoorNotes() {
  return isBalconyDoorConfiguration()
    ? ['Rahmen unten', 'Griff innen + Schnapper']
    : [];
}

function getBalconyDoorNotesHTML() {
  const notes = getBalconyDoorNotes();
  if (!notes.length) return '';
  return `<div class="balcony-door-notes">${notes.map(note => `<p>${note}</p>`).join('')}</div>`;
}

function addBalconyDoorDetails(item) {
  const notes = getBalconyDoorNotes();
  if (!notes.length) return item;

  item.balkon_note_1 = notes[0];
  item.balkon_note_2 = notes[1];
  item.rahmen_unten = 'Ja';
  item.griff_innen_schnapper = 'Ja';
  return item;
}

function calculateThreeFachPrice() {
  return calculateAreaSurcharge(29.90);
}



function goToTabWithCode(code, persistUrl = true) {
//switchTab(0); // open static tab first
  // stop if same button clicked
  if (staticCode === code) {
    return;
  }

  staticCode = code;
  windowConfig.staticCode = code;
  if (persistUrl) updateUrlParam('tab_check', code);


  // set active button
  document.querySelectorAll('.tab-nav-buttons button').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.querySelector(`.tab-nav-buttons button[onclick*="${code}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // reset selections
  windowConfig.profile = null;
  windowConfig.profileImg = null;

  windowConfig.wing = null;
  windowConfig.wingId = null;
  windowConfig.wingSvg = null;
  windowConfig.wingPrice = null;

  windowConfig.opening = null;
  windowConfig.openingId = null;
  windowConfig.openingSvg = null;
  windowConfig.openingPrice = null;

  // reload tabs
  renderTab1Options(GLOBAL_TABS.find(t => String(t.id) === '1'));
  renderTab2WingOptions();
  renderTab3OpeningOptions();
  renderTab4BeschlagOptions();

}







// Helper: update a URL query parameter without reloading the page
function updateUrlParam(key, value) {
  const url = new URL(window.location);
  if (value === null || value === undefined || value === '') url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState({}, '', url);
}




// Helper: get a URL query parameter case-insensitive
function getUrlParam(key) {
  const params = new URLSearchParams(window.location.search);
  for (const [k, v] of params.entries()) if (k.toLowerCase() === key.toLowerCase()) return v;
  return null;
}

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const tabCode = params.get('tab_check');
  if (tabCode && tabMapcheck[tabCode]) pendingStaticCode = tabCode;

  // Restore selections from URL query parameters
  const tabSelectors = {
    profile:  { tabId: 'tab1', selectFn: selectProfile },
    wing:     { tabId: 'tab2' },
    opening:  { tabId: 'tab3' },
    beschlag: { tabId: 'beschlag-tab', selectFn: selectBeschlag },

    // 🔥 Tab 5 subtabs (store/restore via URL)
    'farbe innen':   { tabId: 'tab5' },
    'farbe außen':   { tabId: 'tab5' },
    'farbe aussen':  { tabId: 'tab5' }, // german spelling variant
    griff:           { tabId: 'tab5' },
    isolierglas:     { tabId: 'tab5' },
    ornament:        { tabId: 'tab5' }
  };


  setTimeout(() => {
    for (const [paramKey, tabInfo] of Object.entries(tabSelectors)) {
      const value = getUrlParam(paramKey);
      if (!value) continue;
      const tabContainer = document.getElementById(tabInfo.tabId);
      if (!tabContainer) continue;

      let matchedOption = null;
      tabContainer.querySelectorAll('.card-option').forEach(opt => {
        const label = (opt.getAttribute('data-label') || opt.innerText || '').trim();
        if (label.toLowerCase() === value.toLowerCase()) matchedOption = opt;
      });

   if (matchedOption) {

  tabContainer.querySelectorAll('.card-option')
    .forEach(o => o.classList.remove('active'));

  matchedOption.classList.add('active');

  if (tabInfo.selectFn) {
    tabInfo.selectFn(matchedOption, matchedOption.getAttribute('data-label') || value);
  }

  // ❌ REMOVE THIS
  // matchedOption.click();

  // ✅ SAVE ONLY
  if (
    paramKey.startsWith('farbe') ||
    paramKey === 'griff' ||
    paramKey === 'isolierglas' ||
    paramKey === 'ornament'
  ) {
    const subtabId = matchedOption.closest('[data-subtab-id]')?.dataset.subtabId;
    if (subtabId) {
      TAB5_SELECTION[subtabId] = matchedOption.dataset.id;
    }
  }
}

    }
   restorePreviews();

setTimeout(() => {
  restoreActiveSelections();   // ✅ delayed restore
  updateAllSidebars();         // ✅ force update after restore
}, 500);

updateTabEnableStatus();
  }, 300);


  setTimeout(() => {
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');

  if (widthInput) {
    widthInput.addEventListener('input', () => {
  updateThreeFachPriceIfActive();
  updateAllSidebars(); // 🔥 ADD
});
  }

  if (heightInput) {
    heightInput.addEventListener('input', () => {
  updateThreeFachPriceIfActive();
  updateAllSidebars(); // 🔥 ADD
});
  }

}, 500);



});

// ============ GLOBAL STATE ============

let TAB5_LAZY_CACHE = {
  innen: null,
  aussen: null
};

let currentTab = 0;
const windowConfig = {
  staticCode: null,
  profile: null, profileImg: null,
  wing: null, wingImg: null, wingSvg: null, wingPrice: null, wingId: null,
  opening: null, openingImg: null, openingSvg: null, openingPrice: null, openingId: null,
  beschlagId: null,
   // 🔥 NEW: Tab 5
  farbeInnen: null,
  farbeInnenfill: null,
  farbeInnenDefs:null,
  farbeouteDefs:null,
  farbeouterfill: null,
  farbeAussen: null,
  griff: null,
  griffhandel: null,
  isolierglas: null,
  ornament: null,
  fensterbankAnschlussprofilId: '__none__',
  fensterbankAnschlussprofil: '',
  fensterbankAddHeight: 0,
  fensterbankPricePerMeter: 0,
rollladen: null,      // label chosen in Tab 6 → ROLLLADEN
rollladenMounting: '',
rollladenDrive: '',
rollladenOn: false   // convenience boolean for drawing the box

};


const selectedBySection = {};
let beschlagLabel = 'SIEGENIA FAVORIT BASIS';
let ALL_COMBOS = [];
let COMBO_ROWS_BY_KEY = {};
let COMBO_ROWS_PROMISES = {};
let GLOBAL_TABS = [];
let ALL_WING_OPTIONS = [];
let TAB5_SELECTION = {};
let TAB5_PRELOAD = {
  innen: null,
  aussen: null
};
let TAB5_COLOR_PROMISES = {
  innen: null,
  aussen: null
};
const TAB5_COLOR_LIMIT = 100;
const TAB5_COLOR_ENDPOINTS = {
  innen: 'https://droplify.de/deine-fenster24/admin/get-tab5-innen.php',
  aussen: 'https://droplify.de/deine-fenster24/admin/get-tab5-aussen.php'
};
const GRIFF_OPTION_ORDER = [
  ['232', 'standard weiss'],
  ['234', 'silber'],
  ['233', 'stahl'],
  ['236', 'braun'],
  ['872', 'hoppe silber abschliessbar'],
  ['237', 'hoppe stahl'],
  ['873', 'hoppe braun abschliessbar'],
  ['235', 'hoppe weiss abschliessbar'],
  ['1051', 'weiss'],
  ['1052', 'silber'],
  ['1053', 'schwarz']
];

function getTab5ColorType(subName) {
  if (subName.includes('innen')) return 'innen';
  if (subName.includes('außen') || subName.includes('aussen')) return 'aussen';
  return null;
}

function getTab5ColorUrl(type) {
  return `${TAB5_COLOR_ENDPOINTS[type]}?limit=${TAB5_COLOR_LIMIT}&offset=0&v=${Date.now()}`;
}

async function fetchTab5ColorOptions(type) {
  if (!type || !TAB5_COLOR_ENDPOINTS[type]) return [];
  if (Array.isArray(TAB5_PRELOAD[type]) && TAB5_PRELOAD[type].length) {
    return TAB5_PRELOAD[type];
  }

  if (!TAB5_COLOR_PROMISES[type]) {
    TAB5_COLOR_PROMISES[type] = fetch(getTab5ColorUrl(type), { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`Color options request failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const tab = data.tabs?.find(t => String(t.id) === '5');
        const options = tab?.subtabs?.[0]?.options || [];
        TAB5_PRELOAD[type] = options;
        return options;
      })
      .finally(() => {
        TAB5_COLOR_PROMISES[type] = null;
      });
  }

  return TAB5_COLOR_PROMISES[type];
}

function sortGriffOptions(options) {
  const idOrder = new Map(GRIFF_OPTION_ORDER.map(([id], idx) => [id, idx]));
  const labelOrder = new Map(GRIFF_OPTION_ORDER.map(([, label], idx) => [normalizeConfigText(label), idx]));

  options.sort((a, b) => {
    const idA = idOrder.has(String(a.id)) ? idOrder.get(String(a.id)) : null;
    const idB = idOrder.has(String(b.id)) ? idOrder.get(String(b.id)) : null;

    const labelA = labelOrder.has(normalizeConfigText(a.label || ''))
      ? labelOrder.get(normalizeConfigText(a.label || ''))
      : null;
    const labelB = labelOrder.has(normalizeConfigText(b.label || ''))
      ? labelOrder.get(normalizeConfigText(b.label || ''))
      : null;

    const orderA = idA ?? labelA ?? 999;
    const orderB = idB ?? labelB ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.label || '').localeCompare(String(b.label || ''));
  });
}

let forceInitialTabOpen = true;

// Helper: enable/disable tabs by index
// Helper: enable/disable tabs by index

let maxUnlockedTab = 1;

function updateTabEnableStatus() {
  const tabLinks = document.querySelectorAll('.tab-link');

  tabLinks.forEach((tab, idx) => {
    const allowed = idx <= maxUnlockedTab;

    if (allowed) {
      tab.classList.remove('disabled');
      tab.style.pointerEvents = 'auto';
      tab.style.opacity = '1';
    } else {
      tab.classList.add('disabled');
      tab.style.pointerEvents = 'none';
      tab.style.opacity = '0.4';
    }
  });
}
/******
function enableTabByIndex(idx) {
  const tabLinks = document.querySelectorAll('.tab-link');

  // ✅ SHIFT INDEX BY +1 (because of new tab0)
  const realIndex = idx + 1;

  if (realIndex < 0 || realIndex >= tabLinks.length) return;

  const tab = tabLinks[realIndex];
  tab.classList.remove('disabled');
  tab.style.pointerEvents = 'auto';
  tab.style.opacity = '1';
}
function enableTabsStartingFrom(startIdx) {
  const tabLinks = document.querySelectorAll('.tab-link');

  // ✅ SHIFT START INDEX
  const realStart = startIdx + 1;

  for (let i = realStart; i < tabLinks.length; i++) {
    const tab = tabLinks[i];
    tab.classList.remove('disabled');
    tab.style.pointerEvents = 'auto';
    tab.style.opacity = '1';
  }
}

*******/

// === reset Tab 4 size inputs when combo (profile/wing/opening/static) changes ===
function resetGroesseInputs() {
  const w = document.getElementById('width');
  const h = document.getElementById('height');
  if (!w || !h) return;
  w.value = ''; h.value = '';
  w.min = h.min = '';
  w.max = h.max = '';
  w.readOnly = true;
  h.readOnly = true;

  const sbW = document.getElementById('sb-width');
  const sbH = document.getElementById('sb-height');
  if (sbW) sbW.textContent = '';
  if (sbH) sbH.textContent = '';
}

// === ALWAYS call this after any selection that can affect Tab 4 ===
function refreshGroesseAfterChange() {
  restorePreviews();

  // 🔥 ONLY ONE SOURCE OF TRUTH
  recomputeTab4Base();

  updateGroesseDropdownsAndSidebar();
  updateThreeFachPriceIfActive();

  updateAllSidebars();
}
function autoSelectFirstOptionInTab(tabIndex) {
  const tabContents = document.querySelectorAll('.tab-content');
  if (tabIndex < 0 || tabIndex >= tabContents.length) return;
  const tabContent = tabContents[tabIndex];
  if (!tabContent) return;
  const optionGrid = tabContent.querySelector('.option-grid');
  if (!optionGrid) return;
  const firstOption = optionGrid.querySelector('.card-option');
  if (!firstOption) return;
  const activeOption = optionGrid.querySelector('.card-option.active');
  if (!activeOption) {
    firstOption.classList.add('active');
    firstOption.click();
  }
}

showLoader();

function getTab5SubtabByName(needles) {
  const tab5 = GLOBAL_TABS.find(t => String(t.id) === '5');
  return tab5?.subtabs?.find(st => hasNormalizedText(st.name, needles));
}

function enforceTripleGlazingSelection() {
  if (!isTripleGlazingRequired()) return;
  if (hasNormalizedText(windowConfig.isolierglas, ['3 fach', '3fach'])) return;

  windowConfig.isolierglas = '3-Fach Verglasung';
  const sidebar = document.getElementById('glass-sidebar-isolierglas');
  if (sidebar) sidebar.textContent = windowConfig.isolierglas;
}

function refreshAreaBasedPrices() {
  enforceTripleGlazingSelection();

  const isolierglasSubtab = getTab5SubtabByName(['isolierglas']);
  if (isolierglasSubtab && windowConfig.isolierglas) {
    extraPriceTab5Map[isolierglasSubtab.id] = isTripleGlazingSelected()
      ? calculateThreeFachPrice()
      : 0;
  }

  const ornamentSubtab = getTab5SubtabByName(['ornament']);
  if (ornamentSubtab && windowConfig.ornament) {
    extraPriceTab5Map[ornamentSubtab.id] = getOrnamentPrice(windowConfig.ornament);
  }

  const vsgSubtab = getTab5SubtabByName(['vsg']);
  if (vsgSubtab && windowConfig.vsg) {
    extraPriceTab5Map[vsgSubtab.id] = getVsgPrice(windowConfig.vsg);
  }

  updateSillProfilePrice();
}

function updateThreeFachPriceIfActive() {
  refreshAreaBasedPrices();
  recomputeTotalPrice();
  syncEffectiveHeightDisplays();
}


// ============ FETCH AND INITIALIZE ============
const tabsDataUrl = `https://droplify.de/deine-fenster24/admin/get-tabs_front.php?v=${Date.now()}`;
fetch(tabsDataUrl, { cache: 'no-store' })
  .then(res => res.json())
  .then(data => {

	  data = normalizeConfiguratorData(data);
    const tabs = data.tabs;
    GLOBAL_TABS = tabs;
    ALL_COMBOS = data.height_width_prices || [];
    ALL_WING_OPTIONS = data.combo_options || [];

    // Render tab headers
   const header = document.getElementById('tabHeaderContainer');
header.innerHTML = '';

// ✅ ADD NEW STATIC TAB FIRST
const staticTab = document.createElement('div');
//staticTab.className = 'tab-link active';
staticTab.className = 'tab-link';
staticTab.textContent = 'Typ wählen'; // name whatever you want
staticTab.onclick = () => switchTab(0);
header.appendChild(staticTab);

// ✅ NOW ADD API TABS (SHIFT INDEX)
tabs.forEach((tab, idx) => {
  const div = document.createElement('div');
  div.className = 'tab-link';
  div.setAttribute('onclick', `switchTab(${idx + 1})`);
  div.setAttribute('data-id', tab.id);
  div.textContent = tab.name;
  header.appendChild(div);
    });


// ===== CREATE TAB0 AND MOVE STATIC BUTTONS =====
let tab0 = document.getElementById('tab0');

if (!tab0) {
  tab0 = document.createElement('div');
  tab0.id = 'tab0';
  tab0.className = 'tab-content active';

  // 🔥 MOVE EXISTING STATIC BUTTONS (FROM HTML)
  const staticButtons = document.querySelector('.tab-nav-buttons');
  if (staticButtons) {
    tab0.appendChild(staticButtons); // MOVE (NOT COPY)
  }

  // insert BEFORE tab1
  const tab1 = document.getElementById('tab1');
  if (tab1) {
    tab1.parentNode.insertBefore(tab0, tab1);
  }
}


    // Render Tab 1 (Profile) options and auto-select first option on load
    renderTab1Options(tabs.find(t => String(t.id) === '1'));
    const firstProfile = document.querySelector('#tab1 .card-option');
    if (firstProfile) selectProfile(firstProfile, firstProfile.getAttribute('data-label'));

    // Render Tab 2 (Wing) options; no auto-select
    renderTab2WingOptions();

    // Render Tab 3 (Opening) options; no auto-select
    renderTab3OpeningOptions();

    // Handle Tab 4 subtabs and options
    const tab4 = tabs.find(t => String(t.id) === '4');
    if (tab4 && tab4.subtabs) {
      const subtabBtns = document.querySelectorAll('#tab4 .tabs .tab');
      tab4.subtabs.forEach((subtab, idx) => {
        if (subtabBtns[idx]) {
          subtabBtns[idx].textContent = subtab.name;
          subtabBtns[idx].setAttribute('data-id', subtab.id);
          subtabBtns[idx].onclick = () => switchSubTab(subtab.id, subtabBtns);
        }
      });

      tab4.subtabs.forEach((subtab) => {
        if (subtab.name.toLowerCase().includes('größe') || subtab.name.toLowerCase().includes('groesse')) {
          renderOptionsToGridWithExtraJson(`#groesse-tab .option-grid`, subtab.options);
        } else if (subtab.name.toLowerCase().includes('beschlag')) {
          renderTab4BeschlagOptions();
        }
      });
    }
    if (tab4 && tab4.subtabs && tab4.subtabs[0]) {
      switchSubTab(tab4.subtabs[0].id, document.querySelectorAll('#tab4 .tabs .tab'));
    }

	// Handle Tab 5 subtabs and options
////renderTab5Options();

renderTab5Options();


// Handle Tab 6 subtabs and options
renderTab6Options();


    initConfigurator();
    updateTabEnableStatus();


	const initialStaticCode = pendingStaticCode || (tabMapcheck[getUrlParam('tab_check')] ? getUrlParam('tab_check') : '__static_ksf__');
	goToTabWithCode(initialStaticCode, Boolean(pendingStaticCode || getUrlParam('tab_check')));
switchTab(0);

maxUnlockedTab = 1;
updateTabEnableStatus();

    hideLoader();
  })
  .catch(err => {
    hideLoader();
    alert('Daten konnten nicht geladen werden.');
    console.error(err);
  });

// ======= TAB 1 PROFILE =====
// ======= TAB 1 PROFILE =====
function renderTab1Options(tab) {

  const grid = document.querySelector('#tab1 .option-grid');

  if (!grid || !tab || !tab.options) return;

  grid.innerHTML = '';

  let allowedIds = [];

  // 🔴 collect option_id from combo JSON
  if (staticCode) {

    tab.options.forEach(opt => {

      try {

        const extra = JSON.parse(opt.extra_json || '{}');

        const ids = Array.isArray(extra.combo_option_ids)
          ? extra.combo_option_ids
          : [];

        if (ids.length === 1 && ids[0] === staticCode) {

          if (Array.isArray(extra.combo_rows)) {

            extra.combo_rows.forEach(row => {
              if (row.option_id) {
                allowedIds.push(String(row.option_id));
              }
            });

          }

        }

      } catch(e){}

    });

  }

let visibleIndex = 0; // track filtered index

tab.options.forEach((opt, idx) => {

  // 🔴 filter options using option_id
  if (staticCode && !allowedIds.includes(String(opt.id))) {
    return;
  }

  // ===============================
  // ✅ INSERT IMAGE BASED ON STATIC TYPE
  // ===============================

  if (staticCode === '__static_ksf__') {

    // 👉 IMAGE BEFORE FIRST
    if (visibleIndex === 0) {
      const banner = document.createElement('div');
      banner.className = 'combo-banner';
      banner.innerHTML = `<img src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/Logo-Web.jpg?v=1778837486" style="width:100%;margin-bottom:10px;">`;
      grid.appendChild(banner);
    }

    // 👉 IMAGE AFTER 3rd
    if (visibleIndex === 3) {
      const banner = document.createElement('div');
      banner.className = 'combo-banner';
      banner.innerHTML = `<img src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/logo-web2.jpg?v=1778837486" style="width:100%;margin:15px 0;">`;
      grid.appendChild(banner);
    }
  }

  if (staticCode === '__static_balkon__') {

    if (visibleIndex === 0) {
      const banner = document.createElement('div');
      banner.className = 'combo-banner';
      banner.innerHTML = `<img src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/Logo-Web.jpg?v=1778837486" style="width:100%;margin:15px 0;">`;
      grid.appendChild(banner);
    }

	 if (visibleIndex === 3) {
      const banner = document.createElement('div');
      banner.className = 'combo-banner';
      banner.innerHTML = `<img src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/logo-web2.jpg?v=1778837486" style="width:100%;margin:15px 0;">`;
      grid.appendChild(banner);
    }

  }

  // ===============================
  // 🔹 ORIGINAL CARD (UNCHANGED)
  // ===============================

  const div = document.createElement('div');

  div.className = 'card-option' + (visibleIndex === 0 ? ' active' : '');

  const label = opt.label.replace(/^DRUTEX\s*/i, '');

  div.setAttribute('data-id', opt.id);
  div.setAttribute('data-label', label);

  div.addEventListener('click', function(e){
    e.stopPropagation();
    selectProfile(div, label);
  });

  let extraHTML = '';

  try {
    const parsed = JSON.parse(opt.extra_json || '{}');
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const icon = parsed.checkmark_image_url || 'https://droplify.de/deine-fenster24/frontend/checkmark.svg';

    if (items.length) {
      extraHTML = `<ul>${items.map(txt => `<li><img class="checkmark" src="${icon}"> ${txt}</li>`).join('')}</ul>`;
    }
  } catch (e) {}

  div.innerHTML = `
    <span class="discount-label">-35%</span>
    <img src="${opt.image_url}" alt="${opt.label}">
    <div><strong>${opt.label}</strong>${extraHTML}</div>
    <span class="checkmark-box"><img src="https://droplify.de/deine-fenster24/frontend/Vector.svg"></span>
  `;

  grid.appendChild(div);

  if (visibleIndex === 0) {
    windowConfig.profile = label;
    windowConfig.profileImg = opt.image_url;
  }

  visibleIndex++; // 🔥 important
});

}





function selectProfile(el, label) {
  document.querySelectorAll('#tab1 .card-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');

  windowConfig.profile = label;
  windowConfig.profileImg = el.querySelector('img')?.src || null;

  // Changing profile invalidates downstream selections
  windowConfig.wing = null;
  windowConfig.wingId = null;
  windowConfig.wingSvg = null;
  windowConfig.wingPrice = null;
  windowConfig.opening = null;
  windowConfig.openingId = null;
  windowConfig.openingSvg = null;
  windowConfig.openingPrice = null;


  setTab4BaseSVG(null);

  renderTab2WingOptions();
  renderTab3OpeningOptions();
  renderTab4BeschlagOptions();

  resetGroesseInputs();
  refreshGroesseAfterChange();
  updateAllSidebars();

  updateUrlParam('profile', label);

    // 🔥 keep Tab 7 summary always in sync
  updateTab7Summary();

maxUnlockedTab = 2;
updateTabEnableStatus();
}

// ======= TAB 2: WING (combo-driven) =======
function getCurrentProfileId() {
  const el = document.querySelector('#tab1 .card-option.active');
  return el ? el.getAttribute('data-id') : null;
}
function getCurrentStaticCode() { return staticCode ? staticCode : null; }

function renderTab2WingOptions() {
  const grid = document.querySelector('#tab2 .option-grid');
  if (!grid) return;

let comboIds = [];

const profileId = getCurrentProfileId();

// stop if profile not ready yet
if (!staticCode || !profileId) {
  grid.innerHTML = '';
  return;
}

comboIds.push(staticCode);
comboIds.push(profileId);

  const tab2 = GLOBAL_TABS.find(t => String(t.id) === '2');
  if (!tab2 || !tab2.options) return;

  let matchingRows = [];
  tab2.options.forEach(opt => {
    try {
      const extra = JSON.parse(opt.extra_json || '{}');
      const ids = Array.isArray(extra.combo_option_ids) ? extra.combo_option_ids : [];
      if (ids.length !== comboIds.length) return;
      let match = true;
      for (let i = 0; i < ids.length; i++) if (String(ids[i]) !== String(comboIds[i])) { match = false; break; }
      if (match && Array.isArray(extra.combo_rows)) matchingRows.push(...extra.combo_rows);
    } catch (e) {}
  });

  grid.innerHTML = '';
  if (!matchingRows.length) {
    grid.innerHTML = '<div style="padding:2em;color:#888;">Keine Flügel-Optionen für diese Kombi.</div>';
    windowConfig.wing = null; windowConfig.wingId = null; windowConfig.wingSvg = null; windowConfig.wingPrice = null;
    updateWingSidebarSVG(null);
    updateWingSidebarPrice(null);
    setTab4BaseSVG(null);
    return;
  }

  matchingRows.forEach((row) => {
    const div = document.createElement('div');
    const isActive = (windowConfig.wingId && String(windowConfig.wingId) === String(row.option_id));
    div.className = 'card-option' + (isActive ? ' active' : '');
    div.setAttribute('data-id', row.option_id);
    div.setAttribute('data-label', row.heading || '');

    let imageBlock = '';
    if (row.image_url && row.image_url.trim().startsWith('<svg')) imageBlock = row.image_url;
    else if (row.image_url) imageBlock = `<img src="${row.image_url}" alt="${row.heading || ''}">`;

    div.innerHTML = `
      <div class="wing-svg-container">${imageBlock}</div>
      <div class="wing-content"><strong>${row.heading || ''}</strong></div>
      <span class="checkmark-box"><img src="https://droplify.de/deine-fenster24/frontend/Vector.svg"></span>
    `;

    div.onclick = function() {
      const fullOption = tab2.options.find(o => String(o.id) === String(row.option_id));
      selectWingOption({
        id: row.option_id,
        label: row.heading,
        image_url: row.image_url,
        price: row.price || 0,
        base_img: fullOption ? fullOption.base_img : null
      });
    };

    grid.appendChild(div);
  });

  // ✅ auto-select first Wing if nothing is selected
  const firstOption = grid.querySelector('.card-option');

}

// --------- HELPERS FOR TAB 4 BASE ----------
// >>> NEW: allow passing the source ('db' or 'selected') and tag the svg element
function setTab4BaseSVG(svgStringOrNull, source) {
  const box = document.querySelector('#tab4 #svgPreviewBox');
  if (!box) return;

  if (svgStringOrNull && svgStringOrNull.trim().startsWith('<svg')) {
    box.innerHTML = svgStringOrNull;

    const svg = box.querySelector('svg');

  if (svg) {
  svg.dataset.source = source || 'db';

  const old = svg.querySelector('#measurements, #measurements_selected');
  if (old) old.remove();

  // 🔥 FIX: route correctly
  const hasComments = svg.innerHTML.includes('<!--');

  if (hasComments) {
    mapCommentsToSVG(svg);
  } else {
    mapSVGWithoutComments(svg);
  }
}

  } else {
    box.innerHTML = '';
  }

  if (typeof updateSVGPreviewTab4 === 'function') {
    updateSVGPreviewTab4.__base = null;
    updateSVGPreviewTab4.__polyBBoxCache = null;
  }
  if (typeof updateSelectedBaseSVG === 'function') {
    updateSelectedBaseSVG.__base = null;
  }
}

function getActiveWingBaseSVG() {
  try {
    const activeWing = document.querySelector('#tab2 .card-option.active');
    if (!activeWing) return null;
    const wingId = activeWing.getAttribute('data-id');
    const tab2 = GLOBAL_TABS.find(t => String(t.id) === '2');
    const fullOpt = tab2 && tab2.options ? tab2.options.find(o => String(o.id) === String(wingId)) : null;
    const baseImg = fullOpt && fullOpt.base_img;
    if (baseImg && baseImg.trim().startsWith('<svg')) return baseImg;
  } catch (_) {}
  return null;
}

function getActiveOpeningSVGFromDOM() {
  const node = document.querySelector('#tab3 .card-option.active .opening-svg-container');
  if (!node) return null;
  const html = node.innerHTML || '';
  return html.trim().startsWith('<svg') ? html : null;
}

// Rule: use Wing base_img if present; else use CURRENT Opening DOM SVG; else clear
function recomputeTab4Base() {

  // ✅ PRIORITY 1: opening (USER SELECTION MUST WIN)
  if (windowConfig.openingSvg && windowConfig.openingSvg.startsWith('<svg')) {
    setTab4BaseSVG(windowConfig.openingSvg, 'selected');
    return;
  }

  // ✅ PRIORITY 2: wing base (fallback only)
  const wingBase = getActiveWingBaseSVG();
  if (wingBase) {
    setTab4BaseSVG(wingBase, 'db');
    return;
  }

  setTab4BaseSVG(null);
}

// optional modification hook — currently just uses your opening toggles
function modifyTab4SVGWithOpening() {
  if (!windowConfig.openingSvg) return;
  try { updateOpeningSvgInFourthTab(windowConfig.openingSvg, windowConfig.opening || ''); } catch(_) {}
}

// >>> unified updater delegates to DB resizer OR selected-option resizer
function updateTab4SVG({ width, height, modify = true } = {}) {
  recomputeTab4Base();
  if (modify) modifyTab4SVGWithOpening();

  const svgEl = document.querySelector('#tab4 #svgPreviewBox svg');
  if (!svgEl) return;

  const w = (width != null) ? width : (+document.getElementById('width')?.value || 400);
  const h = (height != null) ? height : (+document.getElementById('height')?.value || 400);



  const src = (svgEl.dataset.source || 'db').toLowerCase();
  if (src === 'selected') {

    if (typeof updateSelectedBaseSVG === 'function') updateSelectedBaseSVG(w, h);
  } else {



    if (typeof updateSVGPreviewTab4 === 'function') updateSVGPreviewTab4(w, h);
  }

  if (windowConfig.griffColor && windowConfig.griff) {
  updateHandleColor(svgEl, windowConfig.griffColor);
}
}
// ---------------------------------------------------------

function selectWingOption(option) {
  document.querySelectorAll('#tab2 .card-option').forEach(o => o.classList.remove('active'));
  const activeDiv = document.querySelector(`#tab2 .card-option[data-id="${option.id}"]`);
  if (activeDiv) activeDiv.classList.add('active');

  windowConfig.wing       = option.label;
  windowConfig.wingId     = option.id;
  windowConfig.wingPrice  = option.price;
  windowConfig.wingSvg    = option.image_url;

  //recomputeTab4Base();

  updateWingSidebarSVG(option.image_url);
  updateWingSidebarPrice(option.price);

  renderTab3OpeningOptions();
  renderTab4BeschlagOptions();

  ///enableTabByIndex(2);

  resetGroesseInputs();
  refreshGroesseAfterChange();

  recomputeTab4Base();
updateAllSidebars();

  updateUrlParam('wing', option.label);

  // 🔥 RESET FLOW AFTER TAB 2 CHANGE
maxUnlockedTab = 3;
updateTabEnableStatus();

}

// ================= NORMALIZER =================
function normalizeKey(str) {
  if (!str) return '';

  return str
    .replace(/[–—]/g, '-')              // fix weird dashes
    .replace(/\s*-\s*/g, '-')           // remove spaces around dash
    .replace(/\s+/g, ' ')               // normalize spaces
    .trim()
    .toLowerCase();
}


// ================= RAW MAPPING (3 PART) =================
const RAW_MAPPING = {
  "Festelement - Festelement - Festelement": "Fest/Fest/Fest im Rahmen",
  "Festelement - Dreh-Kipp Rechts - Festelement": "Fest/DKR/Fest",
  "Festelement - Dreh-Kipp Links - Festelement": "Fest/DKL/Fest",
  "Dreh-Kipp Links - Festelement - Festelement": "DKL/Fest/Fest",
  "Festelement - Festelement - Dreh-Kipp Rechts": "Fest/Fest/DKR",
  "Dreh-Kipp Links - Festelement - Dreh-Kipp Rechts": "DKL/Fest/DKR",
  "Festelement - Dreh Links - Dreh-Kipp Rechts": "Fest/DL-Pfosten/DKR",
  "Dreh Links - Dreh-Kipp Rechts - Festelement": "DL-Pfosten/DKR-Fest",
  "Dreh-Kipp Links - Dreh Rechts - Festelement": "DKL/DR-Pfosten/Fest",
  "Festelement Stulp Dreh Links (ohne Griff) - Dreh-Kipp Rechts": "Fest/DL-Stulp/DKR",
  "Stulp Dreh Links (ohne Griff) - Dreh-Kipp Rechts - Festelement": "DL-Stulp/DKR-Fest",
  "Dreh-Kipp Links - Stulp Dreh Rechts (ohne Griff) - Festelement": "DKL/DR-Stulp/Fest"
};


// ================= RAW MAPPING (2 PART) =================
const RAW_MAPPING_2 = {
  "Festelement - Festelement": "Fest/Fest",
  "Festelement - Dreh-Kipp Rechts": "Fest/DKR",
  "Dreh-Kipp Links - Festelement": "DKL/Fest",
  "Dreh-Kipp Links - Dreh-Kipp Rechts": "DKL/DKR-Pfosten",
  "Dreh-Kipp Links - Dreh Rechts": "DKL/DR-Pfosten",
  "Dreh Links - Dreh-Kipp Rechts": "DL/DKR-Pfosten",
  "Dreh-Kipp Links - Stulp Dreh Rechts (ohne Griff)": "DKL/DR-Stulp",
  "Stulp Dreh Links (ohne Griff) - Dreh-Kipp Rechts": "DL-Stulp/DKR"
};


// ================= BUILD FINAL MAP =================
const OPENING_NAME_MAP = {};

Object.keys(RAW_MAPPING).forEach(key => {
  OPENING_NAME_MAP[normalizeKey(key)] = RAW_MAPPING[key];
});

Object.keys(RAW_MAPPING_2).forEach(key => {
  OPENING_NAME_MAP[normalizeKey(key)] = RAW_MAPPING_2[key];
});


// ================= FINAL ORDER =================
const OPENING_ORDER = [
  // 3 PART
  "Fest/Fest/Fest im Rahmen",
  "Fest/DKR/Fest",
  "Fest/DKL/Fest",
  "DKL/Fest/Fest",
  "Fest/Fest/DKR",
  "DKL/Fest/DKR",
  "Fest/DL-Pfosten/DKR",
  "DL-Pfosten/DKR-Fest",
  "Fest im Rahmen-DKL-Pfosten -DKR",
  "DKL-Pfosten-DKR - Fest im Rahmen",
  "DKL/DR-Pfosten/Fest",
  "Fest/DL-Stulp/DKR",
  "DL-Stulp/DKR-Fest",
  "DKL/DR-Stulp/Fest",

  // 2 PART
  "Fest/Fest",
  "Fest/DKR",
  "DKL/Fest",
  "DKL/DKR-Pfosten",
  "DKL/DR-Pfosten",
  "DL/DKR-Pfosten",
  "DKL/DR-Stulp",
  "DL-Stulp/DKR"
];


// ================= MAIN FUNCTION =================
function renderTab3OpeningOptions() {
  const grid = document.querySelector('#tab3 .option-grid');
  if (!grid) return;

  const profileId = getCurrentProfileId();
  const wingId = windowConfig.wingId;

  if (!staticCode || !profileId || !wingId) {
    grid.innerHTML = '';
    return;
  }

  const comboIds = [
    String(staticCode),
    String(profileId),
    String(wingId)
  ];

  const tab3 = GLOBAL_TABS.find(t => String(t.id) === '3');
  if (!tab3 || !tab3.options) return;

  let matchingRows = [];

  tab3.options.forEach(opt => {
    try {
      const extra = JSON.parse(opt.extra_json || '{}');
      const ids = Array.isArray(extra.combo_option_ids) ? extra.combo_option_ids : [];

      if (ids.length !== comboIds.length) return;

      let match = true;
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i]) !== String(comboIds[i])) {
          match = false;
          break;
        }
      }

      if (!match) return;

      if (Array.isArray(extra.combo_rows)) {
        matchingRows.push(...extra.combo_rows);
      }

    } catch (e) {}
  });

  grid.innerHTML = '';

  if (!matchingRows.length) {
    grid.innerHTML = '<div style="padding:2em;color:#888;">Keine Öffnungs-Optionen für diese Kombi.</div>';
    windowConfig.opening = null;
    windowConfig.openingSvg = null;
    windowConfig.openingPrice = null;
    windowConfig.openingId = null;
    updateOpeningSidebarSVG(null);
    recomputeTab4Base();
    return;
  }

  // ================= SORTING =================
  matchingRows.sort((a, b) => {

    const nameA = a.heading.includes('/')
      ? a.heading
      : (OPENING_NAME_MAP[normalizeKey(a.heading)] || a.heading);

    const nameB = b.heading.includes('/')
      ? b.heading
      : (OPENING_NAME_MAP[normalizeKey(b.heading)] || b.heading);

    let indexA = OPENING_ORDER.indexOf(nameA);
    let indexB = OPENING_ORDER.indexOf(nameB);

    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;

    return indexA - indexB;
  });

  // ================= RENDER =================
  matchingRows.forEach((row) => {

    let mappedHeading = row.heading;

    // don't touch already formatted names
    if (!row.heading.includes('/')) {
      mappedHeading =
        OPENING_NAME_MAP[normalizeKey(row.heading)] || row.heading;
    }

    const div = document.createElement('div');

    const isActive =
      windowConfig.openingId &&
      String(row.option_id) === String(windowConfig.openingId);

    div.className = 'card-option' + (isActive ? ' active' : '');

    div.setAttribute('data-id', row.option_id);
    div.setAttribute('data-label', mappedHeading || '');

    let imageBlock = '';

    if (row.image_url && row.image_url.trim().startsWith('<svg')) {
      imageBlock = row.image_url;
    } else if (row.image_url) {
      imageBlock = `<img src="${row.image_url}" alt="${mappedHeading || ''}">`;
    }

    div.innerHTML = `
      <div class="opening-svg-container">
        ${imageBlock}
      </div>
      <span class="extra_image">${row.subheading || ''}</span>
      <div class="opening-content"><strong>${mappedHeading || ''}</strong></div>
      <span class="checkmark-box">
        <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg">
      </span>
    `;

    div.onclick = function () {
      selectOpeningSVG(
        this,
        mappedHeading || '',
        row.image_url,
        row.price || null,
        row.option_id
      );
    };

    grid.appendChild(div);
  });

  const firstOption = grid.querySelector('.card-option');

}


function selectOpeningSVG(el, label, svg, price, id) {
  document.querySelectorAll('#tab3 .card-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');

  windowConfig.opening      = label;
  windowConfig.openingSvg   = svg;
  windowConfig.openingPrice = price;
  windowConfig.openingId    = id;

  updateOpeningSidebarSVG(svg);

  // 🔥 THIS WAS MISSING
  document.getElementById('sb-opening').textContent = label;

  renderTab4BeschlagOptions();
  resetGroesseInputs();
  refreshGroesseAfterChange();

  updateUrlParam('opening', label);

  // 🔥 NOW USER CAN GO TO TAB 4
maxUnlockedTab = 4;
updateTabEnableStatus();

}

// ======= TAB 4 BESCHLAG OPTIONS with combo filtering =======
function renderTab4BeschlagOptions() {
  const grid = document.querySelector('#beschlag-tab .option-grid');
  if (!grid) return;

  const tab4 = GLOBAL_TABS.find(t => String(t.id) === '4');
  if (!tab4 || !tab4.subtabs) return;

  const beschlagSubtab = tab4.subtabs.find(st => st.name.toLowerCase().includes('beschlag'));
  if (!beschlagSubtab || !beschlagSubtab.options) return;

  const options = (beschlagSubtab.options || []).filter(opt =>
    !hasNormalizedText(`${opt.label} ${opt.value_key}`, ['rc1', 'rc2', 'wk1', 'wk2'])
  );

  grid.innerHTML = '';

  if (!options.length) {
    grid.innerHTML = '<div style="padding:2em;color:#888;">Keine Beschlag-Optionen verfügbar.</div>';
    beschlagLabel = '';
    windowConfig.beschlagId = null;
    updateUrlParam('beschlag', '');
    return;
  }

  options.forEach((opt) => {
    const div = document.createElement('div');

    const isActive =
      windowConfig.beschlagId &&
      String(windowConfig.beschlagId) === String(opt.id);

    div.className = 'card-option' + (isActive ? ' active' : '');
    div.setAttribute('data-id', opt.id);
    div.setAttribute('data-label', opt.label || '');

    let imageBlock = '';
    if (opt.image_url && opt.image_url.trim().startsWith('<svg')) {
      imageBlock = opt.image_url;
    } else if (opt.image_url) {
      imageBlock = `<img src="${opt.image_url}" alt="${opt.label || ''}">`;
    }

    div.innerHTML = `
      ${imageBlock}
      <div>
        <strong>${opt.label || ''}</strong>
        ${opt.value_key ? `<br><span>${opt.value_key}</span>` : ''}
      </div>
      <span class="checkmark-box">
        <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg">
      </span>
    `;

    div.onclick = function () {
      selectBeschlag(this, opt.label || '');
    };

    grid.appendChild(div);
  });

  // ✅ keep your existing auto-select behavior
  const activeOption = grid.querySelector('.card-option.active');
  if (activeOption) {
    activeOption.click();
  } else {
    const first = grid.querySelector('.card-option');
    if (first) first.click();
  }
}

function selectBeschlag(el, label) {
  document.querySelectorAll('#beschlag-tab .card-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');

  beschlagLabel = label;
  windowConfig.beschlagId = el.getAttribute('data-id');

  document.getElementById('sb-beschlag').textContent = label;

  updateUrlParam('beschlag', label);

  // 🔥 ADD THESE
  recomputeTotalPrice();
  updateAllSidebars();
}









// ===== TAB 5 HANDLING =====
// Wrapper: initializes Tab 5 buttons and loads first subtab only when Tab 5 is visible.
function renderTab5Options(loadDefault = currentTab === 4) {
  const tab5 = GLOBAL_TABS.find(t => String(t.id) === '5');
  if (!tab5 || !tab5.subtabs) return;

  const subtabBtns = document.querySelectorAll('#tab5 .tabs .tab');
  tab5.subtabs.forEach((subtab, idx) => {
    if (subtabBtns[idx]) {
      subtabBtns[idx].textContent = subtab.name;
      subtabBtns[idx].setAttribute('data-id', subtab.id);
      subtabBtns[idx].onclick = () => switchTab5Subtab(subtab.id, subtabBtns);
    }
  });

  // Load first subtab by default
  if (loadDefault && tab5.subtabs[0]) {
    switchTab5Subtab(tab5.subtabs[0].id, subtabBtns);
  }
}

async function initAllTab5Subtabs() {
  const tab5 = GLOBAL_TABS.find(t => String(t.id) === '5');
  if (!tab5 || !tab5.subtabs) return;

  const btns = document.querySelectorAll('#tab5 .tabs .tab');

  for (const subtab of tab5.subtabs) {
    await switchTab5Subtab(subtab.id, btns);

    // wait so auto-select works
    await new Promise(r => setTimeout(r, 120));
  }
}



function updateHandleColor(svg, color) {
  if (!svg || !color) return;

  const handles = svg.querySelectorAll('.handle_handle');

  handles.forEach(g => {
    g.querySelectorAll('*').forEach(el => {
      el.setAttribute('fill', color);
      el.setAttribute('stroke', color);
    });
  });
}

async function preloadTab5Data() {
  try {
    await Promise.all([
      fetchTab5ColorOptions('innen'),
      fetchTab5ColorOptions('aussen')
    ]);
  } catch (e) {
    console.error('❌ Preload failed', e);
  }
}



async function switchTab5Subtab(subtabId, subtabBtns) {

	// 🔥 RESET WRONG STATE
if (!TAB5_SELECTION[subtabId]) {
  TAB5_SELECTION[subtabId] = null;
}
	// ===== HIDE GRIFF BASED ON TAB 3 =====
const hideGriffIds = ['429', '440', '497'];

const griffTabBtn = document.querySelector('#tab5 .tabs .tab:nth-child(3)');

const openingId = String(windowConfig.openingId || '');

if (hideGriffIds.includes(openingId)) {
  if (griffTabBtn) griffTabBtn.style.display = 'none';
} else {
  if (griffTabBtn) griffTabBtn.style.display = '';
}



  const tab5 = GLOBAL_TABS.find(t => String(t.id) === '5');
  if (!tab5) return;

  const subtab = tab5.subtabs.find(st => String(st.id) === String(subtabId));
  if (!subtab) return;

  const subName = (subtab.name || '').toLowerCase();
  const colorType = getTab5ColorType(subName);

  const isColorTab = !!colorType;

  if (!window.TAB5_CACHE) window.TAB5_CACHE = {};

  const grid = document.querySelector('#tab5 .option-grid');
  if (!grid) return;
  grid.classList.toggle('tab5-isolierglas-grid', subName.includes('isolierglas'));

  // ===============================
  // ACTIVE BUTTON
  // ===============================
  if (subtabBtns) {
    subtabBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(subtabBtns).find(
      b => b.getAttribute('data-id') === String(subtabId)
    );
    if (activeBtn) activeBtn.classList.add('active');
  }

  // ===============================
  // RESET
  // ===============================
  grid.innerHTML = '';

  let allOptions = [];
  let autoSelectDone = false;

  // =========================================================
  // 🔵 STATIC TABS
  // =========================================================
  if (!isColorTab) {

    const options = subtab.options || [];
    allOptions = options;

    if (!options.length) {
      grid.innerHTML = '<div style="padding:2em;color:#888;">Keine Optionen verfügbar.</div>';
      return;
    }
let filteredOptions = options.slice();

// 🔥 APPLY STATIC FILTER (TAB 0)
const griffFilterMap = {
  '__static_ksf__': ['232','233','234','235','236','237','872','873'],   // ← your real griff IDs
 '__static_balkon__': ['232','233','234','235','236','237','872','873'],
  '__static_schiebe__': ['1051','1052','1053']
};

if (subName.includes('griff')) {
  const allowed = griffFilterMap[staticCode];


  if (allowed) {
    filteredOptions = options.filter(opt =>
      allowed.includes(String(opt.id))
    );
  }
}

if (subName.includes('isolierglas') && isTripleGlazingRequired()) {
  filteredOptions = filteredOptions.filter(opt =>
    !hasNormalizedText(opt.label, ['2 fach', '2fach'])
  );

  if (!hasNormalizedText(windowConfig.isolierglas, ['3 fach', '3fach'])) {
    windowConfig.isolierglas = '';
  }
}

if (subName.includes('ornament')) {
  filteredOptions = normalizeOrnamentOptions(filteredOptions);
}

// ✅ PASS FILTERED OPTIONS
renderOptions(filteredOptions);
    return;
  }

  // =========================================================
  // 🟢 COLOR TABS (FULL LOAD)
  // =========================================================
  const loader = document.createElement('div');
  loader.style.textAlign = 'center';
  loader.style.padding = '15px';
  loader.innerText = 'Loading...';

  // ===============================
  // CACHE
  // ===============================
  if (window.TAB5_CACHE[subtabId]) {
    allOptions = window.TAB5_CACHE[subtabId];
    renderOptions(allOptions);
    return;
  }

  async function loadAll() {

    if (!grid.contains(loader)) grid.appendChild(loader);

    try {
      const options = await fetchTab5ColorOptions(colorType);

      if (!options.length) {
        loader.innerText = 'Keine Optionen verfügbar.';
        return;
      }

      allOptions = options;

      loader.remove();

      renderOptions(allOptions);

      window.TAB5_CACHE[subtabId] = allOptions;

    } catch (err) {
      console.error(err);
      loader.innerText = 'Error loading';
    }
  }

  // =========================================================
  // 🔧 RENDER FUNCTION
  // =========================================================
  function renderOptions(options) {

	  // 🔥 SORT BY data-value (value_key)
if (subName.includes('griff')) {
  sortGriffOptions(options);
} else if (!subName.includes('ornament')) options.sort((a, b) => {
  const valA = (a.value_key || '').toString().toLowerCase();
  const valB = (b.value_key || '').toString().toLowerCase();

  // numeric sort if possible
  const numA = parseFloat(valA);
  const numB = parseFloat(valB);

  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }

  // fallback string sort
  return valA.localeCompare(valB);
});

    options.forEach((opt) => {

      const div = document.createElement('div');
      div.className = 'card-option';
      div.dataset.id = opt.id;
      div.dataset.label = opt.label || '';
      div.dataset.value = opt.value_key || '';

      let imageBlock = '';
      if (opt.image_url && opt.image_url.trim().startsWith('<svg')) {
        imageBlock = opt.image_url;
      } else if (opt.image_url) {
        imageBlock = `<img src="${opt.image_url}" alt="">`;
      }

      div.innerHTML = `
        ${imageBlock}
        <div><strong>${opt.label || ''}</strong></div>
        <span class="checkmark-box">
          <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg">
        </span>
      `;

     div.onclick = function () {

  const isVSG = subName.includes('vsg');

  // ===============================
  // ✅ VSG TOGGLE LOGIC
  // ===============================
if (isVSG) {

  // 🔁 TOGGLE OFF
  if (div.classList.contains('active')) {
    div.classList.remove('active');

    delete TAB5_SELECTION[subtabId];

    windowConfig.vsg = null;

    // 🔥 CLEAR SIDEBAR
    const el = document.getElementById('glass-sidebar-vsg');
    if (el) el.textContent = '';

    extraPriceTab5Map[subtabId] = 0;

  recomputeTotalPrice();
updateAllSidebars();

    return;
  }

  // 🔁 TOGGLE ON
  document.querySelectorAll('#tab5 .card-option')
    .forEach(o => o.classList.remove('active'));

  div.classList.add('active');

  TAB5_SELECTION[subtabId] = opt.id;

  // 🔥 ADD THIS (CRITICAL)
  const el = document.getElementById('glass-sidebar-vsg');
  if (el) el.textContent = opt.label;
} else {

    // ===============================
    // ✅ NORMAL BEHAVIOR (UNCHANGED)
    // ===============================
    document.querySelectorAll('#tab5 .card-option')
      .forEach(o => o.classList.remove('active'));

    div.classList.add('active');
	// 🔥 ADD THIS LINE HERE
TAB5_SELECTION[subtabId] = opt.id;

  }

  // ===============================
  // ✅ COMMON LOGIC (UNCHANGED)
  // ===============================

  const value = opt.label || '';

  updateUrlParam(subtab.name.toLowerCase(), value);

  if (subName.includes('innen')) {

    windowConfig.farbeInnen = value;
    updateUrlParam('farbe innen', value);

    const el = document.getElementById('glass-sidebar-innen');
    if (el) el.textContent = value;

    const svgNode = div.querySelector('svg');
    if (svgNode) {
      const shape = svgNode.querySelector('[fill]');
      const defs = svgNode.querySelector('defs');
      if (shape) {
        windowConfig.farbeInnenfill = shape.getAttribute('fill');
        windowConfig.farbeInnenDefs = defs ? defs.innerHTML : '';
      }
    }

  } else if (subName.includes('außen') || subName.includes('aussen')) {


    windowConfig.farbeAussen = value;
    updateUrlParam('farbe außen', value);

    const el = document.getElementById('glass-sidebar-aussen');
    if (el) el.textContent = value;
  }


else if (subName.includes('griff')) {

  windowConfig.griff = value;

  const el = document.getElementById('glass-sidebar-griff');
  if (el) el.textContent = value;
}


// 🔥🔥🔥 ADD THIS PART RIGHT HERE 🔥🔥🔥
else if (subName.includes('isolierglas')) {

  windowConfig.isolierglas = value;

  const el = document.getElementById('glass-sidebar-isolierglas');
  if (el) el.textContent = value;
}

else if (subName.includes('ornament')) {

  windowConfig.ornament = value;

  const el = document.getElementById('glass-sidebar-ornament');
  if (el) el.textContent = value;
}

else if (subName.includes('vsg')) {

  windowConfig.vsg = value;

  const el = document.getElementById('glass-sidebar-vsg');
  if (el) el.textContent = value;
}




  // ===============================
  // 🔥 PRICE LOGIC
  // ===============================
  // ===============================
// 🔥 SAFE PRICE LOGIC
// ===============================

// 👉 default values
let usePercent = false;
let percent = 0;

// 👉 read extra_json
try {
  const extra = JSON.parse(opt.extra_json || '{}');

  if (extra.price) {
    percent = parseFloat(extra.price) || 0;

    if (percent > 0) {
      usePercent = true;
    }
  }

} catch (e) {}

if (subName.includes('isolierglas')) {
  extraPriceTab5Map[subtabId] = hasNormalizedText(opt.label, ['3 fach', '3fach'])
    ? calculateThreeFachPrice()
    : 0;
}
else if (subName.includes('vsg')) {
  extraPriceTab5Map[subtabId] = getVsgPrice(opt.label);
}
else if (subName.includes('ornament')) {
  extraPriceTab5Map[subtabId] = getOrnamentPrice(opt.label);
}
else if (
  usePercent &&
  (
    subName.includes('innen') ||
    subName.includes('außen') ||
    subName.includes('aussen')
  )
) {

 /// const currentBase = basePriceTab4 + extraPriceTab6;


const currentBase = basePriceTab4;

  extraPriceTab5Map[subtabId] = (currentBase * percent) / 100;

}
else {
  extraPriceTab5Map[subtabId] = parseFloat(opt.price) || 0;
}

  // ===============================
  // 🔧 HANDLE COLOR FIX
  // ===============================
if (subName.includes('griff')) {

  windowConfig.griff = value;
  windowConfig.griffColor = opt.value_key;

  const svg = document.querySelector('#tab4 #svgPreviewBox svg');

  if (svg && opt.value_key) {
    updateHandleColor(svg, opt.value_key);
  }
}

recomputeTotalPrice();
updateAllSidebars();

};

      grid.appendChild(div);
    });

    // =========================================================
    // AUTO SELECT (UNCHANGED)
    // =========================================================
   // ❌ STOP auto-select for VSG tab
/////if (subName.includes('vsg')) return;

// ===============================
// 🔥 VSG SPECIAL RESTORE (NO AUTO SELECT)
// ===============================
if (subName.includes('vsg')) {

  const savedId = TAB5_SELECTION[subtabId];

  if (savedId) {
    const match = [...grid.querySelectorAll('.card-option')]
      .find(el => String(el.dataset.id) === String(savedId));

    if (match) {
      setTimeout(() => match.click(), 50); // restore toggle
    }
  }

  return; // ❗ still prevent auto-select
}

// ✅ ALWAYS clear UI first
grid.querySelectorAll('.card-option').forEach(el => {
  el.classList.remove('active');
});

if (!autoSelectDone) {

  autoSelectDone = true;

  setTimeout(() => {

    // 🔥 FIRST: check saved selection
    const savedId = TAB5_SELECTION[subtabId];

    if (savedId) {
      const match = [...grid.querySelectorAll('.card-option')]
        .find(el => String(el.dataset.id) === String(savedId));

      if (match) {
        match.click(); // 🔥 IMPORTANT (triggers full logic)
        return;        // stop here
      }
    }

    // ===============================
    // ✅ YOUR EXISTING LOGIC (UNCHANGED)
    // ===============================
    const findMatch = (key) =>
      [...grid.querySelectorAll('.card-option')]
        .find(el => (el.dataset.label || '').toLowerCase() === (key || '').toLowerCase());

    let selected = null;

    if (subName.includes('innen')) {
      selected = findMatch(windowConfig.farbeInnen);
    }
    else if (subName.includes('außen') || subName.includes('aussen')) {
      selected = findMatch(windowConfig.farbeAussen);
    }



    if (selected) selected.click();
    else {
      const first = grid.querySelector('.card-option');
      if (first) first.click();
    }
updateAllSidebars();
  }, 50);
}
  }

  // ===============================
  // LOAD EVERYTHING
  // ===============================
// ===============================
// ⚡ USE PRELOADED DATA (FAST)
// ===============================

if (colorType && Array.isArray(TAB5_PRELOAD[colorType]) && TAB5_PRELOAD[colorType].length) {
  renderOptions(TAB5_PRELOAD[colorType]);
  return;
}

// ⛑ fallback (only if preload not finished yet)
await loadAll();

setTimeout(() => {
  updateAllSidebars();
}, 100);
}

let currentQty = 1;

function adjustQty(delta) {
  currentQty = Math.max(1, currentQty + delta);

  // Update ALL qty spans in Tabs 4–7 (including Tab 7 summary)
  document.querySelectorAll('.quantity_cover #qty, #t7-qty').forEach(el => {
    el.textContent = currentQty;
  });

recomputeTotalPrice();
updateAllSidebars();
}

function updateAllSidebars() {
  refreshAreaBasedPrices();

  if (typeof updateUnifiedSidebar === 'function') updateUnifiedSidebar();
  if (typeof updateTab5Sidebar === 'function') updateTab5Sidebar();
  if (typeof updateTab6Sidebar === 'function') updateTab6Sidebar();
  if (typeof updateTab7Summary === 'function') updateTab7Summary();

  // 🔥 ADD THIS
  if (typeof updateGroesseDropdownsAndSidebar === 'function') {
    updateGroesseDropdownsAndSidebar();
  }

  updateTab4SVG();
  syncEffectiveHeightDisplays();



}

// Recompute total with qty
function recomputeTotalPrice() {
updateSillProfilePrice();

const totalTab5 = Object.values(extraPriceTab5Map).reduce((a, b) => a + b, 0);
const totalTab6 = Object.values(extraPriceTab6Map || {}).reduce((a, b) => a + b, 0);

const total = (basePriceTab4 + totalTab5 + totalTab6) * currentQty;
  // Tab 4 sidebar
const t4Price = document.querySelector('#tab4 .price-box .price');

if (t4Price) {
  if (hasVisitedTab5) {
    setSidebarPrice(t4Price, total);
  } else {
    setSidebarPrice(t4Price, basePriceTab4);
  }
}
  // Tab 5 sidebar
  const glassPrice = document.getElementById('glass-price');
  setSidebarPrice(glassPrice, total);

  // Tab 6 sidebar
  const zubePrice = document.getElementById('zubehoer-price');
  setSidebarPrice(zubePrice, total);

  // Tab 7 sidebar
  const t7Price = document.getElementById('t7-price');
  setSidebarPrice(t7Price, total);
}




// ===== TAB 6 HANDLING (ZUBEHÖR) =====
// ===== TAB 6 HANDLING (ZUBEHÖR) =====
function getTab6SubtabContainer(subtab) {
  if (!subtab) return null;

  if (String(subtab.id) === SILL_PROFILE_SUBTAB_ID || hasNormalizedText(subtab.name, ['fensterbank anschlussprofil'])) {
    return document.getElementById('fensterbankanschlussprofil-subtab');
  }

  const name = subtab.name || '';
  if (hasNormalizedText(name, ['rahmen'])) return document.getElementById('rahmenverbreiterung-subtab');
  if (hasNormalizedText(name, ['rollladen'])) return document.getElementById('rollladen-subtab');
  if (hasNormalizedText(name, ['sprossen'])) return document.getElementById('sprossen-subtab');
  if (hasNormalizedText(name, ['fensterzubehoer'])) return document.getElementById('fensterzubehoer-subtab');

  return null;
}

function renderTab6Options() {
  const tab6 = GLOBAL_TABS.find(t => String(t.id) === '6');
  if (!tab6 || !tab6.subtabs) return;

  const visibleSubtabs = tab6.subtabs.filter(subtab =>
    !hasNormalizedText(subtab.name, ['sprossen', 'fensterzubehoer'])
  );

  const subtabBtns = document.querySelectorAll('#tab6 .tabs .tab');
  subtabBtns.forEach((btn, idx) => {
    const subtab = visibleSubtabs[idx];
    if (!subtab) {
      btn.style.display = 'none';
      btn.onclick = null;
      btn.removeAttribute('data-id');
      return;
    }

    btn.style.display = '';
    btn.textContent = subtab.name;
    btn.setAttribute('data-id', subtab.id);
    btn.onclick = () => switchTab6Subtab(subtab.id, subtabBtns);
  });

  ['sprossen-subtab', 'fensterzubehoer-subtab'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  if (visibleSubtabs[0]) {
    switchTab6Subtab(visibleSubtabs[0].id, subtabBtns);
  }
recomputeTotalPrice();
updateAllSidebars();
}

function switchTab6Subtab(subtabId, subtabBtns) {
  const tab6 = GLOBAL_TABS.find(t => String(t.id) === '6');
  if (!tab6) return;
  const subtab = tab6.subtabs.find(st => String(st.id) === String(subtabId));
  if (!subtab) return;

  if (subtabBtns) {
    subtabBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(subtabBtns).find(b => b.getAttribute('data-id') === String(subtabId));
    if (activeBtn) activeBtn.classList.add('active');
  }

  document.querySelectorAll('#tab6 .accessory-subtab').forEach(div => div.style.display = 'none');
  const activeSubtabDiv = getTab6SubtabContainer(subtab);
  if (activeSubtabDiv) activeSubtabDiv.style.display = '';

  const subName = subtab.name.toLowerCase();
if (subName.includes('sprossen')) {
  renderTab6SprossenOptions(subtab, subtabId);
} else if (subName.includes('rahmen')) {
  renderTab6Rahmenverbreiterung(subtab, subtabId);
} else if (subName.includes('fensterzubeh')) {
  renderTab6Fensterzubehoer(subtab, subtabId);
} else if (String(subtab.id) === SILL_PROFILE_SUBTAB_ID || hasNormalizedText(subName, ['fensterbank anschlussprofil'])) {
  renderTab6FensterbankAnschlussprofil(subtab, subtabId);
} else if (subName.includes('rollladen')) {
  renderTab6RollladenOptions(subtab, subtabId);
}
recomputeTotalPrice();
updateAllSidebars();
}

// ---- SPROSSEN ----
function renderTab6SprossenOptions(subtab, subtabId) {


  const grid = document.querySelector('#sprossen-subtab .option-grid');
  if (!grid) return;
  grid.innerHTML = '';

  (subtab.options || []).forEach((opt, idx) => {
    const div = document.createElement('div');
    div.className = 'card-option' + (idx === 0 ? ' active' : '');
    div.dataset.id = opt.id;
    div.dataset.label = opt.label;

    div.innerHTML = `
      ${opt.image_url && opt.image_url.trim().startsWith('<svg')
        ? opt.image_url
        : `<img src="${opt.image_url}" alt="${opt.label}">`}
      <div>
        <strong>${opt.label}</strong>
        ${opt.value_key ? `<span>${opt.value_key}</span>` : ''}
      </div>
      <span class="checkmark-box"><img src="https://droplify.de/deine-fenster24/frontend/Vector.svg"></span>
    `;

div.onclick = () => {
  grid.querySelectorAll('.card-option').forEach(o => o.classList.remove('active'));
  div.classList.add('active');

  document.getElementById('zubehoer-sidebar-sprosse').textContent = opt.label;

  const horiz = document.getElementById('sprosse-horizontal');
  const vert = document.getElementById('sprosse-vertikal');

  //document.getElementById('zubehoer-sidebar-sprosseH').textContent = horiz ? horiz.value : '';
  //document.getElementById('zubehoer-sidebar-sprosseV').textContent = vert ? vert.value : '';

 /// extraPriceTab6 = parseFloat(opt.price) || 0;
  extraPriceTab6Map[subtabId] = parseFloat(opt.price) || 0;
   recomputeTotalPrice();
  updateAllSidebars(); // 🔥 ADD THIS
};


    grid.appendChild(div);
  });

  const first = grid.querySelector('.card-option');
  if (first) first.click();
  recomputeTotalPrice();
recomputeTotalPrice();
updateAllSidebars();
waitForTab6SvgAndInit();  // Wait for SVG and inject dynamic inputs




}

// ---- RAHMENVERBREITERUNG ----
function renderTab6Rahmenverbreiterung(subtab, subtabId){

  const selectsMap = {
    oben: document.getElementById('rb-oben'),
    rechts: document.getElementById('rb-rechts'),
    unten: document.getElementById('rb-unten'),
    links: document.getElementById('rb-links')
  };

  const options = subtab?.options || [];

  if (!options.length) {
    console.warn('❌ No rahmen data');
    return;
  }

  // 🔥 CLEAR OLD OPTIONS (CRITICAL FIX)
  Object.values(selectsMap).forEach(sel => {
    if (!sel) return;
    sel.innerHTML = '';
  });

  // ===============================
  // 🔥 LOOP OPTIONS
  // ===============================


  options.forEach(opt => {


    const tab1Id = String(getCurrentProfileId() || '').trim();
    const dep = String(opt.depends_on || '').trim();

    // ✅ FIXED DEPENDENCY (supports "2,3")
    if (dep) {
      if (!tab1Id) return;

      const depIds = dep.split(',').map(x => x.trim());

      if (!depIds.includes(tab1Id)) {
        return;
      }
    }

    let extra = {};
    try {
      extra = typeof opt.extra_json === 'string'
        ? JSON.parse(opt.extra_json)
        : opt.extra_json || {};
    } catch (e) {}

    const label = (extra.dropdown_label || '').toLowerCase();

    let pos = null;

    if (label.includes('oben')) pos = 'oben';
    else if (label.includes('rechts')) pos = 'rechts';
    else if (label.includes('unten')) pos = 'unten';
    else if (label.includes('links')) pos = 'links';

    if (!pos || !selectsMap[pos]) return;

    const select = selectsMap[pos];

    // ===============================
// ✅ DEFAULT OPTION (FIXED)
// ===============================
if (extra.default_option) {
  const def = document.createElement('option');

  def.value = extra.default_option.label || '';
  def.textContent = extra.default_option.label || '0mm';

  // 🔥 TAKE PRICE FROM JSON
  def.dataset.price = parseFloat(extra.default_option.price || 0);

  def.selected = true;
  select.appendChild(def);
}

// ===============================
// ✅ REAL OPTIONS (FIXED)
// ===============================
(extra.options || []).forEach(item => {
  const option = document.createElement('option');

  option.value = item.label;
  option.textContent = item.label;

  // 🔥 TAKE PRICE FROM JSON (THIS IS THE MAIN FIX)
  option.dataset.price = parseFloat(item.price || 0);

  select.appendChild(option);
});

  });





  // ===============================
  // 🔥 CHANGE HANDLER
  // ===============================
  function updateRahmenSidebar() {

    let total = 0;
    const values = [];

    Object.values(selectsMap).forEach(sel => {
      if (!sel || !sel.value) return;

      values.push(sel.value);

      const selectedOpt = sel.options[sel.selectedIndex];
      total += parseFloat(selectedOpt?.dataset.price || 0);
    });

    const el = document.getElementById('zubehoer-sidebar-rahmen');
    if (el) el.textContent = values.join(' / ');

   extraPriceTab6Map[subtabId] = total;

    recomputeTotalPrice();
updateAllSidebars();

// 🔥 SAVE USER SELECTION
Object.entries(selectsMap).forEach(([pos, sel]) => {
  if (!sel || !sel.value) return;
  TAB6_SELECTION[pos] = sel.value;
});

  }





  // 🔥 RESTORE AFTER EVENTS ARE READY (FINAL FIX)
setTimeout(() => {

  Object.entries(selectsMap).forEach(([pos, sel]) => {

    if (!sel) return;

    const saved = TAB6_SELECTION[pos];

    if (saved) {
      const match = [...sel.options].find(o => o.value === saved);
      if (match) {
        sel.value = saved;

        // 🔥 NOW event exists → this works
        //sel.dispatchEvent(new Event('change'));
      }
    }

  });

}, 50);

   // ===============================
  // 🔥 SAFE EVENT BIND (FIXED)
  // ===============================
  Object.values(selectsMap).forEach(sel => {
    if (!sel) return;

    sel.removeEventListener('change', updateRahmenSidebar);
    sel.addEventListener('change', updateRahmenSidebar);
  });
}

// ---- FENSTERZUBEHÖR ----
function renderTab6Fensterzubehoer(subtab, subtabId) {
  const luefterSel = document.getElementById('lz-luefter');
  const reedSel = document.getElementById('lz-reedkontakt');

  if (luefterSel) {
    luefterSel.onchange = () => {
      document.getElementById('zubehoer-sidebar-luefter').textContent = luefterSel.value;
	  //updateTab5Sidebar();

    };
  }
  if (reedSel) {
    reedSel.onchange = () => {
      document.getElementById('zubehoer-sidebar-reedkontakt').textContent = reedSel.value;
    };
  }
recomputeTotalPrice();
updateAllSidebars();

}

// ---- FENSTERBANK-ANSCHLUSSPROFIL ----
function renderTab6FensterbankAnschlussprofil(subtab, subtabId) {
  const grid = document.querySelector('#fensterbankanschlussprofil-subtab .option-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const options = Array.isArray(subtab?.options) && subtab.options.length
    ? subtab.options
    : SILL_PROFILE_OPTIONS;

  options.forEach((profile) => {
    const div = document.createElement('div');
    const active = String(windowConfig.fensterbankAnschlussprofilId || '__none__') === String(profile.id);

    div.className = 'card-option sill-profile-option' + (active ? ' active' : '');
    div.dataset.id = profile.id;
    div.dataset.label = profile.label;

    const details = profile.id === '__none__'
      ? '<span>Kein Fensterbank-Anschlussprofil</span>'
      : `<span>Art.-Nr. ${profile.article}</span><span>${profile.profile}</span><span>+${profile.addHeight} mm Höhe</span><span>${profile.pricePerMeter.toFixed(2)} €/m, weiß</span>`;

    div.innerHTML = `
      <img class="sill-profile-image" src="https://droplify.de/deine-fenster24/frontend/img/Fensterbankanschlussprofil.jpg" alt="${profile.label || ''}">
      <div class="sill-profile-copy">
        <strong class="sill-profile-title">${profile.label || ''}</strong>
        ${details}
      </div>
      <span class="checkmark-box">
        <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg" alt="">
      </span>
    `;

    div.onclick = () => {
      grid.querySelectorAll('.card-option').forEach(card => card.classList.remove('active'));
      div.classList.add('active');

      windowConfig.fensterbankAnschlussprofilId = profile.id;
      windowConfig.fensterbankAnschlussprofil = profile.id === '__none__' ? '' : profile.label;
      windowConfig.fensterbankAddHeight = parseInt(profile.addHeight || 0, 10);
      windowConfig.fensterbankPricePerMeter = parseFloat(profile.pricePerMeter || 0);

      updateSillProfilePrice();
      syncEffectiveHeightDisplays();
      recomputeTotalPrice();
      updateTab6Sidebar();
      updateTab7Summary();
      updateUrlParam('fensterbank-anschlussprofil', windowConfig.fensterbankAnschlussprofil);
    };

    grid.appendChild(div);
  });

  const activeCard = grid.querySelector('.card-option.active') || grid.querySelector('.card-option');
  if (activeCard && !grid.querySelector('.card-option.active')) activeCard.click();
}

// ---- ROLLLADEN ----
function getRollladenDisplayLabel(opt) {
  const label = opt?.label || opt?.value_key || '';
  return label;
}

function isRollladenSystemSection(section) {
  const id = String(section?.id || '');
  const name = normalizeConfigText(section?.name || '');
  return id === ROLLLADEN_SYSTEM_SECTION_ID || name.includes('system') || name.includes('weitere optionen');
}

function getTab6OptionPriceKey(subtabId, section) {
  return section ? `${subtabId}_${section.id}` : subtabId;
}

function clearTab6SubtabPrices(subtabId) {
  Object.keys(extraPriceTab6Map || {}).forEach(key => {
    if (String(key) === String(subtabId) || String(key).startsWith(`${subtabId}_`)) {
      delete extraPriceTab6Map[key];
    }
  });
}

function getRollladenMountingOptions(opt) {
  const normalized = normalizeConfigText(opt?.label || opt?.value_key || '');
  if (
    String(opt?.id) === '324' ||
    String(opt?.id) === '325' ||
    normalized.includes('ras vorbaurollladen') ||
    normalized.includes('rar vorbaurollladen')
  ) {
    return ['an Fassade', 'an Rahmen'];
  }

  return [];
}

function setRollladenPreview(enabled) {
  const svgNow = document.querySelector('#tab6 #svgPreviewBox svg');
  if (svgNow && typeof drawRollladenBox === 'function') {
    drawRollladenBox(svgNow, enabled);
  }
}

function clearRollladenWindowConfig() {
  Object.keys(windowConfig).forEach(key => {
    if (
      key.startsWith('input_381') ||
      key.startsWith('input_382') ||
      key.startsWith('input_label_381') ||
      key.startsWith('input_label_382')
    ) {
      delete windowConfig[key];
    }
  });

  windowConfig.rollladen = null;
  windowConfig.rollladenMounting = '';
  windowConfig.rollladenDrive = '';
  windowConfig.rollladenOn = false;
}

function getRollladenSummaryLines() {
  const lines = [];
  if (windowConfig.rollladen) lines.push(['Rollladen', windowConfig.rollladen]);
  if (windowConfig.rollladenMounting) lines.push(['Montage', windowConfig.rollladenMounting]);
  if (windowConfig.rollladenDrive) lines.push(['Antrieb', windowConfig.rollladenDrive]);
  return lines;
}

function getRollladenDetailsText() {
  return getRollladenSummaryLines()
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}

function getRollladenDetailsHTML() {
  return getRollladenSummaryLines()
    .map(([label, value]) => `<span class="rollladen-sidebar-line"><strong>${label}:</strong> ${value}</span>`)
    .join('');
}

function escapeInquiryValue(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTextById(id) {
  return (document.getElementById(id)?.textContent || '').trim();
}

function addInquiryLine(lines, label, value) {
  const cleanValue = String(value || '').replace(/\s+/g, ' ').trim();
  if (cleanValue) lines.push(`${label}: ${cleanValue}`);
}

const ROLLLADEN_INQUIRY_COLOR_OPTIONS = [
  'Nicht dabei / andere Farbe',
  'Weiss',
  'Cremeweiß',
  'Basaltgrau',
  'Grau-Sandstruktur',
  'Anthrazitgrau-Holzstruktur',
  'Eiche Natur',
  'Eiche Spezial',
  'Oregon',
  'Palisander',
  'Mahagoni',
  'Nussbaum',
  'Aluminium gebuerstet'
];

function getRollladenInquiryFieldValues() {
  const width = getCurrentWindowWidthMm?.() || parseConfiguratorNumber(getTextById('zubehoer-sidebar-width') || getTextById('sb-width'));
  const height = parseConfiguratorNumber(
    getEffectiveHeightValue?.()
    || getTextById('zubehoer-sidebar-height')
    || getTextById('sb-height')
  );
  const qty = parseInt(currentQty, 10);

  return {
    width: width > 0 ? String(width) : '',
    height: height > 0 ? String(height) : '',
    quantity: Number.isFinite(qty) && qty > 0 ? String(qty) : '1'
  };
}

function renderRollladenColorOptions() {
  return ROLLLADEN_INQUIRY_COLOR_OPTIONS
    .map(color => `<option value="${escapeInquiryValue(color)}">${escapeInquiryValue(color)}</option>`)
    .join('');
}

function buildRollladenInquiryMessage() {
  const lines = [
    'Anfrage Rollläden',
    '',
    'Fensterkonfiguration'
  ];

  addInquiryLine(lines, 'System', windowConfig.profile);
  addInquiryLine(lines, 'Typ', windowConfig.wing);
  addInquiryLine(lines, 'Öffnungsart', windowConfig.opening);
  addInquiryLine(lines, 'Breite', getTextById('zubehoer-sidebar-width') || getTextById('sb-width'));
  addInquiryLine(lines, 'Höhe', getTextById('zubehoer-sidebar-height') || getTextById('sb-height'));
  addInquiryLine(lines, 'Beschlag', getTextById('zubehoer-sidebar-beschlag') || beschlagLabel);
  addInquiryLine(lines, 'Farbe innen', getTextById('zubehoer-sidebar-innen') || getTextById('glass-sidebar-innen'));
  addInquiryLine(lines, 'Farbe außen', getTextById('zubehoer-sidebar-aussen') || getTextById('glass-sidebar-aussen'));
  addInquiryLine(lines, 'Griff', getTextById('zubehoer-sidebar-griff') || getTextById('glass-sidebar-griff'));
  addInquiryLine(lines, 'Isolierglas', getTextById('zubehoer-sidebar-isolierglas') || getTextById('glass-sidebar-isolierglas'));
  addInquiryLine(lines, 'Ornament', getTextById('zubehoer-sidebar-ornament') || getTextById('glass-sidebar-ornament'));
  addInquiryLine(lines, 'Dichtungen', 'schwarz');
  addInquiryLine(lines, 'Rahmenverbreiterung', getTextById('zubehoer-sidebar-rahmen'));
  addInquiryLine(lines, 'Fensterbank-Anschlussprofil', typeof getSillProfileSummary === 'function' ? getSillProfileSummary() : '');

  const rollladenLines = getRollladenSummaryLines();
  if (rollladenLines.length) {
    lines.push('', 'Rollläden');
    rollladenLines.forEach(([label, value]) => addInquiryLine(lines, label, value));
  }

  addInquiryLine(lines, 'Menge', currentQty);
  addInquiryLine(lines, 'Konfigurator URL', window.location.href);

  return lines.join('\n');
}

function updateRollladenInquiryForms() {
  const message = buildRollladenInquiryMessage();
  const fields = getRollladenInquiryFieldValues();

  document.querySelectorAll('.rollladen-inquiry-message').forEach(field => {
    field.value = message;
  });

  document.querySelectorAll('.rollladen-inquiry-width').forEach(field => {
    field.value = fields.width;
  });
  document.querySelectorAll('.rollladen-inquiry-height').forEach(field => {
    field.value = fields.height;
  });
  document.querySelectorAll('.rollladen-inquiry-quantity').forEach(field => {
    field.value = fields.quantity;
  });
}

function getRollladenInquiryHTML() {
  const message = escapeInquiryValue(buildRollladenInquiryMessage());
  const fields = getRollladenInquiryFieldValues();
  const colorOptions = renderRollladenColorOptions();

  return `
    <div class="inquiry-box rollladen-inquiry-box">
      <button type="button" class="inquiry-btn rollladen-inquiry-open">Rollladen-Anfrage</button>
      <div class="rollladen-inquiry-modal" aria-hidden="true">
        <div class="rollladen-inquiry-backdrop" data-rollladen-close></div>
        <div class="rollladen-inquiry-dialog" role="dialog" aria-modal="true" aria-label="Rollladen-Anfrage">
          <button type="button" class="rollladen-inquiry-close" aria-label="Schließen" data-rollladen-close>×</button>
          <img class="rollladen-inquiry-logo" src="https://cdn.shopify.com/s/files/1/0987/9683/1102/files/logo-web2.jpg?v=1778837486" alt="Deine-Fenster24.com">
          <form class="rollladen-inquiry-form" method="post" action="https://deine-fenster24.com/contact#contact_form" accept-charset="UTF-8">
            <input type="hidden" name="form_type" value="contact">
            <input type="hidden" name="utf8" value="✓">
            <input type="hidden" name="contact[tags]" value="Rollladen Anfrage, Konfigurator">
            <div class="rollladen-inquiry-title">Rollladen-Anfrage</div>
            <div class="rollladen-inquiry-fields">
              <label>Name*<input type="text" name="contact[name]" required></label>
              <label>E-Mail*<input type="email" name="contact[email]" required></label>
              <label>Breite (mm)*<input class="rollladen-inquiry-width" type="text" name="contact[Breite (mm)]" value="${escapeInquiryValue(fields.width)}" required></label>
              <label>Höhe (mm)*<input class="rollladen-inquiry-height" type="text" name="contact[Höhe (mm)]" value="${escapeInquiryValue(fields.height)}" required></label>
              <label>Telefon<input type="tel" name="contact[phone]"></label>
              <label>Anzahl<input class="rollladen-inquiry-quantity" type="number" name="contact[Anzahl]" min="1" value="${escapeInquiryValue(fields.quantity)}"></label>
            </div>
            <div class="rollladen-inquiry-color-title">Farbe*</div>
            <div class="rollladen-inquiry-color-help">Falls Ihre Farbe nicht dabei ist, bitte unten im Textfeld beschreiben.</div>
            <div class="rollladen-inquiry-color-area">
              <div class="rollladen-inquiry-color-controls">
                <select class="rollladen-inquiry-color" name="contact[Farbe]" required>
                  <option value="" selected disabled>Bitte Farbe auswählen</option>
                  ${colorOptions}
                </select>
                <div class="rollladen-inquiry-side-options">
                  <label class="rollladen-inquiry-side-option">
                    <input type="radio" name="contact[Farbseite]" value="beidseitig" checked>
                    <span aria-hidden="true"></span>
                    beidseitig
                  </label>
                  <label class="rollladen-inquiry-side-option">
                    <input type="radio" name="contact[Farbseite]" value="nur außen">
                    <span aria-hidden="true"></span>
                    nur außen
                  </label>
                </div>
              </div>
              <div class="rollladen-inquiry-preview">VORSCHAUBILD</div>
            </div>
            <label class="rollladen-inquiry-message-label">Wichtige Infos</label>
            <textarea class="rollladen-inquiry-message" name="contact[body]" rows="12">${message}</textarea>
            <button type="submit" class="rollladen-inquiry-submit">ABSENDEN ›</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function openRollladenInquiryModal(box) {
  const modal = box?.querySelector('.rollladen-inquiry-modal');
  if (!modal) return;
  updateRollladenInquiryForms();
  document.querySelectorAll('.rollladen-inquiry-modal.is-open').forEach(closeRollladenInquiryModal);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('input[name="contact[name]"]')?.focus();
}

function closeRollladenInquiryModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

function syncRollladenInquiryMode() {
  const inquiryMode = !!windowConfig.rollladenOn;

  const tab6 = document.getElementById('tab6');
  if (tab6) {
    const priceBox = tab6.querySelector('.price-box');
    let inquiryBox = tab6.querySelector('.rollladen-inquiry-box');

    if (priceBox) {
      priceBox.style.display = inquiryMode ? 'none' : '';
      if (inquiryMode && !inquiryBox) {
        priceBox.insertAdjacentHTML('afterend', getRollladenInquiryHTML());
        inquiryBox = tab6.querySelector('.rollladen-inquiry-box');
      }
    }

    if (!inquiryMode && inquiryBox) inquiryBox.remove();
  }

  const tab7 = document.getElementById('tab7');
  if (tab7) {
    const checkoutParts = [
      tab7.querySelector('.price_inner'),
      tab7.querySelector('.quantity_app'),
      tab7.querySelector('button.btnmain-cart.cart')
    ].filter(Boolean);

    checkoutParts.forEach(el => {
      el.style.display = inquiryMode ? 'none' : '';
    });

    let inquiryBox = tab7.querySelector('.rollladen-inquiry-box');
    if (inquiryMode && !inquiryBox) {
      const cartButton = tab7.querySelector('button.btnmain-cart.cart');
      const sidebar = tab7.querySelector('.sidebar .forscrolling') || tab7.querySelector('.sidebar');

      if (cartButton) cartButton.insertAdjacentHTML('afterend', getRollladenInquiryHTML());
      else if (sidebar) sidebar.insertAdjacentHTML('beforeend', getRollladenInquiryHTML());
    }

    if (!inquiryMode && inquiryBox) inquiryBox.remove();
  }

  if (inquiryMode) updateRollladenInquiryForms();
}

function updateRollladenAfterSelection(subtabId) {
  recomputeTotalPrice?.();
  updateTab6Sidebar?.();
  updateTab7Summary?.();
  setRollladenPreview(!!windowConfig.rollladenOn);
  syncRollladenInquiryMode();
}

function renderReferenceRollladenOptions(subtab, subtabId, grid) {
  const systemSection = subtab.sections?.find(section => isRollladenSystemSection(section));
  const driveSection = subtab.sections?.find(section => String(section.id) === ROLLLADEN_DRIVE_SECTION_ID);
  const systemOptions = systemSection?.options || [];
  const driveOptions = driveSection?.options || ROLLLADEN_DRIVE_OPTIONS;
  const systemKey = `${subtab.id}_${systemSection?.id || ROLLLADEN_SYSTEM_SECTION_ID}`;
  const driveKey = `${subtab.id}_${driveSection?.id || ROLLLADEN_DRIVE_SECTION_ID}`;

  grid.classList.add('rollladen-reference-layout');
  grid.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'rollladen-reference';
  wrapper.innerHTML = `
    <div class="rollladen-reference-intro">
      <h3>Rolläden</h3>
      <p>Wünschen Sie Rollläden?</p>
      <button type="button" class="rollladen-choice rollladen-none-choice" data-rollladen-none="1" aria-pressed="false">
        <span class="rollladen-checkbox" aria-hidden="true"></span>
        <span>Ich benötige keine Rollläden</span>
      </button>
    </div>
    <div class="rollladen-system-grid"></div>
    <div class="rollladen-drive-section">
      <h3>Welchen Antrieb wünschen Sie?</h3>
      <div class="rollladen-drive-row"></div>
      <p>Ist ihre Wunschauswahl nicht dabei, sprechen Sie uns einfach an!</p>
    </div>
  `;

  const systemGrid = wrapper.querySelector('.rollladen-system-grid');
  const driveRow = wrapper.querySelector('.rollladen-drive-row');
  const noChoice = wrapper.querySelector('.rollladen-none-choice');

  function refreshSelectionUI() {
    const selectedSystemId = String(selectedBySection[systemKey] || '');
    const selectedDriveId = String(selectedBySection[driveKey] || '');

    noChoice.classList.toggle('active', !windowConfig.rollladenOn);
    noChoice.setAttribute('aria-pressed', String(!windowConfig.rollladenOn));

    wrapper.querySelectorAll('.rollladen-reference-card').forEach(card => {
      const active = String(card.dataset.id) === selectedSystemId && !!windowConfig.rollladenOn;
      card.classList.toggle('active', active);
      card.setAttribute('aria-pressed', String(active));
    });

    wrapper.querySelectorAll('.rollladen-mounting-choice').forEach(button => {
      const active =
        String(button.dataset.systemId) === selectedSystemId &&
        button.dataset.mounting === windowConfig.rollladenMounting &&
        !!windowConfig.rollladenOn;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    wrapper.querySelectorAll('.rollladen-drive-choice').forEach(button => {
      const active = String(button.dataset.id) === selectedDriveId;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function selectNoRollladen() {
    clearRollladenWindowConfig();
    delete selectedBySection[systemKey];
    delete selectedBySection[driveKey];
    clearTab6SubtabPrices(subtabId);
    const rollSidebar = document.getElementById('zubehoer-sidebar-rollladen');
    if (rollSidebar) rollSidebar.textContent = '';
    refreshSelectionUI();
    updateRollladenAfterSelection(subtabId);
  }

  function selectDrive(opt) {
    selectedBySection[driveKey] = String(opt.id);
    windowConfig.rollladenDrive = opt.label || '';
    extraPriceTab6Map[getTab6OptionPriceKey(subtabId, driveSection)] = parseFloat(opt.price) || 0;
    refreshSelectionUI();
    updateRollladenAfterSelection(subtabId);
  }

  function ensureDefaultDrive() {
    const current = driveOptions.find(opt => String(opt.id) === String(selectedBySection[driveKey]));
    if (current) {
      windowConfig.rollladenDrive = current.label || '';
      return;
    }

    if (driveOptions[0]) {
      selectedBySection[driveKey] = String(driveOptions[0].id);
      windowConfig.rollladenDrive = driveOptions[0].label || '';
      extraPriceTab6Map[getTab6OptionPriceKey(subtabId, driveSection)] = parseFloat(driveOptions[0].price) || 0;
    }
  }

  function selectSystem(opt, mountingOverride = null) {
    const mountingOptions = getRollladenMountingOptions(opt);
    selectedBySection[systemKey] = String(opt.id);
    windowConfig.rollladen = getRollladenDisplayLabel(opt);
    windowConfig.rollladenOn = true;
    windowConfig.rollladenMounting = mountingOptions.length
      ? (mountingOverride || windowConfig.rollladenMounting || mountingOptions[0])
      : '';
    extraPriceTab6Map[getTab6OptionPriceKey(subtabId, systemSection)] = parseFloat(opt.price) || 0;
    ensureDefaultDrive();
    ensureRollladenInquiryButton();
    refreshSelectionUI();
    updateRollladenAfterSelection(subtabId);
  }

  function restoreSelectedState() {
    if (windowConfig.rollladen && !selectedBySection[systemKey]) {
      const selectedSystem = systemOptions.find(opt =>
        getRollladenDisplayLabel(opt) === windowConfig.rollladen
      );
      if (selectedSystem) selectedBySection[systemKey] = String(selectedSystem.id);
    }

    if (windowConfig.rollladenDrive && !selectedBySection[driveKey]) {
      const selectedDrive = driveOptions.find(opt => opt.label === windowConfig.rollladenDrive);
      if (selectedDrive) selectedBySection[driveKey] = String(selectedDrive.id);
    }
  }

  function ensureRollladenInquiryButton() {
    syncRollladenInquiryMode();
  }

  noChoice.addEventListener('click', selectNoRollladen);

  systemOptions.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'rollladen-reference-card';
    card.dataset.id = opt.id;
    card.dataset.label = getRollladenDisplayLabel(opt);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');

    const mountingOptions = getRollladenMountingOptions(opt);
    const mountingMarkup = mountingOptions.length
      ? `<div class="rollladen-mounting-list">
          ${mountingOptions.map(mounting => `
            <span class="rollladen-mounting-choice" data-system-id="${opt.id}" data-mounting="${mounting}" role="button" tabindex="0" aria-pressed="false">
              <span class="rollladen-checkbox" aria-hidden="true"></span>
              <span>${mounting}</span>
            </span>
          `).join('')}
        </div>`
      : '';

    card.innerHTML = `
      ${opt.image_url ? `<img class="rollladen-system-image" src="${opt.image_url}" alt="${getRollladenDisplayLabel(opt)}">` : ''}
      <span class="rollladen-system-title">${getRollladenDisplayLabel(opt)}</span>
      ${mountingMarkup}
    `;

    card.addEventListener('click', event => {
      const mountingChoice = event.target.closest('.rollladen-mounting-choice');
      if (mountingChoice) {
        selectSystem(opt, mountingChoice.dataset.mounting);
        return;
      }

      selectSystem(opt);
    });

    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectSystem(opt);
      }
    });

    card.querySelectorAll('.rollladen-mounting-choice').forEach(choice => {
      choice.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectSystem(opt, choice.dataset.mounting);
        }
      });
    });

    systemGrid.appendChild(card);
  });

  driveOptions.forEach(opt => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rollladen-choice rollladen-drive-choice';
    button.dataset.id = opt.id;
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `
      <span class="rollladen-checkbox" aria-hidden="true"></span>
      <span>${opt.label || ''}</span>
    `;
    button.addEventListener('click', () => selectDrive(opt));
    driveRow.appendChild(button);
  });

  grid.appendChild(wrapper);

  restoreSelectedState();

  if (!selectedBySection[driveKey] && driveOptions[0]) {
    selectedBySection[driveKey] = String(driveOptions[0].id);
    windowConfig.rollladenDrive = driveOptions[0].label || '';
  }

  refreshSelectionUI();
  updateRollladenAfterSelection(subtabId);
}

function renderTab6RollladenOptions(subtab, subtabId) {

	const previewBox = document.querySelector('#tab6 .preview-box');

if (!previewBox) return;

if (document.querySelector('#tab6')?.classList.contains('active')) {
  previewBox.classList.add('force-top');    // apply
}


  const grid = document.querySelector('#rollladen-subtab');
  if (!grid) return;
  grid.innerHTML = '';

  // 🔥 reset section state when switching subtab
for (const k in selectedBySection) {
  if (!k.startsWith(subtab.id + '_')) continue;
  delete selectedBySection[k];
}

  renderReferenceRollladenOptions(subtab, subtabId, grid);
  return;

  const hasSections = Array.isArray(subtab.sections) && subtab.sections.length > 0;

  const createOptionCard = (opt, section) => {

    const div = document.createElement('div');
    div.className = 'card-option';
    div.dataset.id = opt.id;
    const displayLabel = getRollladenDisplayLabel(opt);
    div.dataset.label = displayLabel;
    const type = (opt.option_type || '').trim();

    // 🔹 TEXT INPUT FIELD
    if (type === 'inputField') {
      div.classList.add('text-input-option-block');
      let inputData = {};
      try { inputData = JSON.parse(opt.extra_json || '{}'); } catch {}
      const labelText = inputData.input_label || opt.label || 'Eingabe';
      const placeholderText = inputData.placeholder || 'Bitte eingeben...';
      const defaultValue = inputData.value || '';

      div.innerHTML = `
        <label class="input-label">${labelText}</label>
        <input type="text" class="text-input-option" placeholder="${placeholderText}" value="${defaultValue}">
      `;

      const input = div.querySelector('input');

      // --- handle default value ---
      if (defaultValue) {
        windowConfig[`input_${opt.id}`] = defaultValue;
        windowConfig[`input_label_${opt.id}`] = labelText;
      }

      // --- manual input change ---
    input.addEventListener('input', e => {
  const val = e.target.value;
  windowConfig[`input_${opt.id}`] = val;
  windowConfig[`input_label_${opt.id}`] = labelText;

  // 🟢 immediately refresh sidebar to show updated Abmessungen
  updateTab6Sidebar?.();
  updateUnifiedSidebar?.();
  updateTab7Summary?.();
});


      return div;
    }

    // 🔹 SELECT WITH IMAGES / DROPDOWN
    if (type === 'selectWithImages') {
      div.classList.add('image-select-option-block');
      let dropdownLabel = opt.label || 'Option auswählen';
      let defaultOpt = null;
      let options = [];
      try {
        const extra = JSON.parse(opt.extra_json || '{}');
        dropdownLabel = extra.dropdown_label || dropdownLabel;
        defaultOpt = extra.default_option || null;
        if (Array.isArray(extra.options)) options = extra.options;
      } catch {}

      const label = document.createElement('label');
      label.textContent = dropdownLabel;
      const dropdown = document.createElement('div');
      dropdown.classList.add('custom-select-dropdown');
      const current = document.createElement('div');
      current.classList.add('current-selection');
      current.textContent = 'Bitte wählen...';
      const list = document.createElement('div');
      list.classList.add('dropdown-list');
      dropdown.append(current, list);
      div.append(label, dropdown);

      const fullOptions = [];
      if (defaultOpt?.label) fullOptions.push({ ...defaultOpt, isDefault: true });
      if (options.length) fullOptions.push(...options);

      fullOptions.forEach(o => {
        const item = document.createElement('div');
        item.classList.add('dropdown-item');
        const imageHtml = (o.image && o.image.trim().startsWith('<svg'))
          ? o.image
          : (o.image ? `<img src="${o.image}" alt="${o.label || ''}">` : '');
        item.innerHTML = `${imageHtml}<span>${o.label || ''}</span>`;
        item.addEventListener('click', () => {
          current.innerHTML = `${imageHtml}<span>${o.label || ''}</span>`;
          list.classList.remove('show');
          // 🟢 store selected label and dropdown name
          windowConfig[`select_${opt.id}`] = o.label || '';
          windowConfig[`select_label_${opt.id}`] = dropdownLabel;
          ///if (section) selectedBySection[section.id] = [String(opt.id)];

if (section && subtab) {
  const key = `${subtab.id}_${section.id}`;
  selectedBySection[key] = String(opt.id);
}

          updateUnifiedSidebar?.();
          updateTab6Sidebar?.();
          updateTab7Summary?.();
        });
        list.appendChild(item);
      });

      // --- preselect default option ---
      if (defaultOpt?.label) {
        const imageHtml = (defaultOpt.image && defaultOpt.image.trim().startsWith('<svg'))
          ? defaultOpt.image
          : (defaultOpt.image ? `<img src="${defaultOpt.image}" alt="${defaultOpt.label}">` : '');
        current.innerHTML = `${imageHtml}<span>${defaultOpt.label}</span>`;
        windowConfig[`select_${opt.id}`] = defaultOpt.label;
        windowConfig[`select_label_${opt.id}`] = dropdownLabel;
      }

      current.addEventListener('click', e => {
        e.stopPropagation();
        list.classList.toggle('show');
      });
      document.addEventListener('click', () => list.classList.remove('show'));
      return div;
    }

 const extraroll = JSON.parse(opt.extra_json || '{}');


	  const features = extraroll.features;

	let liHTML = '';

if (extraroll && extraroll.features) {
  extraroll.features.forEach(feature => {
    liHTML += `<li>${feature}</li>`;
  });
}


    // 🔹 NORMAL CARD OPTION
    const isSvg = typeof opt.image_url === 'string' && opt.image_url.trim().startsWith('<svg');

const imageMarkup = isSvg
  ? `<div class="svg-wrap">${opt.image_url}</div>` // 👈 wrap it
  : (opt.image_url ? `<img src="${opt.image_url}" alt="${opt.label || ''}">` : '');

div.innerHTML = `
  ${imageMarkup}
  <div class="card-text">
    <strong>${displayLabel}</strong>
    <ul class="feature">${liHTML}</ul>
    ${opt.value_key ? `<span>${opt.value_key}</span>` : ''}
  </div>
  <span class="checkmark-box">
    <img src="https://droplify.de/deine-fenster24/frontend/Vector.svg" alt="">
  </span>
`;

if (isSvg) {
  requestAnimationFrame(() => {
    const svg = div.querySelector('.svg-wrap svg');

    if (svg) {

      const hasComments = svg.innerHTML.includes('<!--');

      if (hasComments) {
        mapCommentsToSVG(svg);        // existing logic
      } else {
        mapSVGWithoutComments(svg);   // fallback logic
      }

    } else {
      console.warn('SVG not found');
    }
  });
}


    div.addEventListener('click', () => {
const previewBox = document.querySelector('#tab6 .preview-box');

if (!previewBox) return;

if (document.querySelector('#tab6')?.classList.contains('active')) {
  previewBox.classList.add('force-top');    // apply
}



const parent = div.closest('.option-grid');
const isWeitere = (section?.name || '').toLowerCase().includes('weitere');
const isSystemSection = isRollladenSystemSection(section);
const isActive = div.classList.contains('active');

// 👉 TOGGLE ONLY for Rolläden system choices
if ((isWeitere || isSystemSection) && isActive) {

  // ❌ DESELECT
  div.classList.remove('active');



  if (section && subtab) {
    const key = `${subtab.id}_${section.id}`;
    delete selectedBySection[key];
  }

  // 🔥 CLEAR EVERYTHING
  windowConfig.rollladen = null;
  windowConfig.rollladenOn = false;
  clearTab6SubtabPrices(subtabId);

  document.getElementById('zubehoer-sidebar-rollladen').textContent = '';

  updateDependentSections?.(subtab);
  recomputeTotalPrice?.();
  updateTab6Sidebar?.();
  updateTab7Summary?.();

  const svgNow = document.querySelector('#tab6 #svgPreviewBox svg');
  if (svgNow && typeof drawRollladenBox === 'function') {
    drawRollladenBox(svgNow, false);
  }

  return; // 🚨 STOP
}

// 👉 NORMAL SELECT
if (parent) {
  parent.querySelectorAll('.card-option').forEach(c => c.classList.remove('active'));
}

div.classList.add('active');

if (section && subtab) {
  const key = `${subtab.id}_${section.id}`;
  selectedBySection[key] = String(opt.id);
}

if (isSystemSection) {
  windowConfig.rollladen = displayLabel;
  windowConfig.rollladenOn = true;
  document.getElementById('zubehoer-sidebar-rollladen').textContent = displayLabel;
}

extraPriceTab6Map[getTab6OptionPriceKey(subtabId, section)] = parseFloat(opt.price) || 0;

updateDependentSections?.(subtab);
recomputeTotalPrice?.();
updateTab6Sidebar?.();
updateTab7Summary?.();

      //if (section) selectedBySection[section.id] = [String(opt.id)];
	if (section && subtab) {
  const key = `${subtab.id}_${section.id}`;
  selectedBySection[key] = String(opt.id);
}

      updateDependentSections?.(subtab);

      if (isSystemSection) {
        document.getElementById('zubehoer-sidebar-rollladen').textContent = displayLabel;
        windowConfig.rollladen = displayLabel;
        windowConfig.rollladenOn = !!windowConfig.rollladen;
      }
      extraPriceTab6Map[getTab6OptionPriceKey(subtabId, section)] = parseFloat(opt.price) || 0;
      recomputeTotalPrice?.();
      updateTab6Sidebar?.();
      updateTab7Summary?.();


      syncRollladenInquiryMode();

      const svgNow = document.querySelector('#tab6 #svgPreviewBox svg');
      if (svgNow && typeof drawRollladenBox === 'function')
        drawRollladenBox(svgNow, windowConfig.rollladenOn);

      // 🟢 when selecting system, apply dependent defaults
      if (section?.name?.toLowerCase().includes('system')) {
        autoSelectDependentDefaults(subtab);
      }
    });

    return div;
  };

  // --- render sections
  if (hasSections) {
    subtab.sections.forEach(section => {

      if (!Array.isArray(section.options) || section.options.length === 0) return;
      const secBlock = document.createElement('div');
      secBlock.className = 'section-block';
      secBlock.dataset.sectionId = section.id;
      const safeId = section.name
        ? section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
        : 'section-' + section.id;
      secBlock.id = safeId;

      if (section.name) {
        const h = document.createElement('h4');
        h.className = 'section-heading';
        h.textContent = section.name;
        secBlock.appendChild(h);
      }

      const list = document.createElement('div');
      list.className = 'option-grid';
     /// section.options.forEach(opt => list.appendChild(createOptionCard(opt, section)));

	 section.options.forEach(opt => {
  const card = createOptionCard(opt, section);

  // ✅ restore active state
 const key = `${subtab.id}_${section.id}`;
if (selectedBySection[key] === String(opt.id)) {
  card.classList.add('active');
}

  list.appendChild(card);
});

      secBlock.appendChild(list);
     // grid.appendChild(secBlock);

	const existing = grid.querySelector(`[data-section-id="${section.id}"]`);

if (existing) {
  grid.replaceChild(secBlock, existing);
} else {
  const allSections = [...grid.children];

  if ((section.name || '').toLowerCase().includes('weitere')) {
    grid.insertBefore(secBlock, grid.firstChild);
  } else {
    grid.appendChild(secBlock);
  }
}


    });

    updateDependentSections?.(subtab);

    // 🔹 Apply defaults for dependent sections
    function autoSelectDependentDefaults(subtab) {


      subtab.sections.forEach(section => {
        const block = document.querySelector(`.section-block[data-section-id="${section.id}"]`);
        if (!block) return;
        const opts = Array.from(block.querySelectorAll('.card-option, .image-select-option-block, .text-input-option-block'));
        opts.forEach(card => {
          const optId = card.dataset.id;
          const optObj = section.options.find(o => String(o.id) === String(optId));
          if (!optObj) return;
          let hasDefault = false;
          try {
            const extra = JSON.parse(optObj.extra_json || '{}');
            if (extra.is_default || extra.default_option || extra.default === true) hasDefault = true;
          } catch {}
          if (hasDefault) {
            if (card.classList.contains('text-input-option-block')) {
              const input = card.querySelector('input');
              const label = card.querySelector('label')?.textContent?.trim();
              if (input?.value) {
                windowConfig[`input_${optId}`] = input.value;
                windowConfig[`input_label_${optId}`] = label;
              }
            } else if (card.classList.contains('image-select-option-block')) {
              const current = card.querySelector('.current-selection');
              const labelVal = current?.textContent?.trim();
              const labelName = card.querySelector('label')?.textContent?.trim();
              if (labelVal) {
                windowConfig[`select_${optId}`] = labelVal;
                windowConfig[`select_label_${optId}`] = labelName;
              }
            } else {
              card.click();
            }
          }
        });


      });
      updateUnifiedSidebar?.();
      updateTab6Sidebar?.();
      updateTab7Summary?.();
    }

    return;
  }

  (subtab.options || []).forEach(opt => {
    grid.appendChild(createOptionCard(opt));
  });
}












function updateTab7Summary() {

	document.querySelectorAll('.quantity_cover #qty, #t7-qty').forEach(el => {
    el.textContent = currentQty;
  });
  // === Left Summary ===
  document.getElementById('t7-system').textContent   = windowConfig.profile || '';
  document.getElementById('t7-typ').textContent      = windowConfig.wing || '';
  document.getElementById('t7-opening').textContent  = windowConfig.opening || '';

  document.getElementById('t7-width').textContent    = document.getElementById('sb-width')?.textContent || '';
  document.getElementById('t7-height').textContent   = document.getElementById('sb-height')?.textContent || '';
  document.getElementById('t7-beschlag').textContent = beschlagLabel || '';

  document.getElementById('t7-innen').textContent    = document.getElementById('glass-sidebar-innen')?.textContent || '';
  document.getElementById('t7-aussen').textContent   = document.getElementById('glass-sidebar-aussen')?.textContent || '';
  document.getElementById('t7-griff').textContent    = document.getElementById('glass-sidebar-griff')?.textContent || '';
  document.getElementById('t7-isolierglas').textContent = document.getElementById('glass-sidebar-isolierglas')?.textContent || '';
  document.getElementById('t7-ornament').textContent    = document.getElementById('glass-sidebar-ornament')?.textContent || '';

// === Right Sidebar Summary (Tab 7) ===
document.getElementById('t7-sidebar-profile').textContent    = windowConfig.profile || '';
document.getElementById('t7-sidebar-wing').textContent       = windowConfig.wing || '';
document.getElementById('t7-sidebar-opening').textContent    = windowConfig.opening || '';
document.getElementById('t7-sidebar-width').textContent      = document.getElementById('sb-width')?.textContent || '';
document.getElementById('t7-sidebar-height').textContent     = document.getElementById('sb-height')?.textContent || '';
document.getElementById('t7-sidebar-beschlag').textContent   = beschlagLabel || '';

// Colors / Glas / Ornament from Tab 5
document.getElementById('t7-sidebar-innen').textContent      = document.getElementById('glass-sidebar-innen')?.textContent || '';
document.getElementById('t7-sidebar-aussen').textContent     = document.getElementById('glass-sidebar-aussen')?.textContent || '';
document.getElementById('t7-sidebar-griff').textContent      = document.getElementById('glass-sidebar-griff')?.textContent || '';
document.getElementById('t7-sidebar-isolierglas').textContent= document.getElementById('glass-sidebar-isolierglas')?.textContent || '';
document.getElementById('t7-sidebar-ornament').textContent   = document.getElementById('glass-sidebar-ornament')?.textContent || '';
const t7Fensterbank = document.getElementById('t7-sidebar-fensterbank');
if (t7Fensterbank) t7Fensterbank.textContent = getSillProfileSummary();
const t7BalconyNotes = document.getElementById('t7-sidebar-balkon-notes');
if (t7BalconyNotes) t7BalconyNotes.innerHTML = getBalconyDoorNotesHTML();

// Zubehör from Tab 6 (mirror values directly)
document.getElementById('t7-sidebar-rahmen').textContent     = document.getElementById('zubehoer-sidebar-rahmen')?.textContent || '';
	document.getElementById('t7-sidebar-luefter').textContent    = document.getElementById('zubehoer-sidebar-luefter')?.textContent || '';
	document.getElementById('t7-sidebar-reedkontakt').textContent= document.getElementById('zubehoer-sidebar-reedkontakt')?.textContent || '';
	document.getElementById('t7-sidebar-rollladen').innerHTML   = getRollladenDetailsHTML();
	syncRollladenInquiryMode();


  // === SVG Preview ===
// === SVG Preview ===
const target = document.getElementById('tab7-svgPreviewBox');
const liveSvg = document.querySelector('#tab6 #svgPreviewBox svg'); // always take current active SVG
if (target && liveSvg) {
  target.innerHTML = '';
  const clone = liveSvg.cloneNode(true);
  target.appendChild(clone);


const appendedSVG = target.querySelector('svg');

// Ensure Rollladen head box exists in Tab 7 copy as well
drawRollladenBox(appendedSVG, !!windowConfig.rollladenOn);


  if (windowConfig.farbeInnenDefs) {
    // does the cloned SVG already have a <defs>?
    let defsNode = appendedSVG.querySelector('defs');
    if (!defsNode) {
      defsNode = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      appendedSVG.insertBefore(defsNode, appendedSVG.firstChild);
    }

    defsNode.innerHTML += windowConfig.farbeInnenDefs;
  }





// apply stored colors for static elements
const inner = appendedSVG.querySelector('#inner');
if (inner) inner.style.fill = windowConfig.farbeInnenfill;

const outer = appendedSVG.querySelector('#outer');
if (outer) outer.style.fill = windowConfig.farbeInnenfill;

// apply stored colors for dynamic ids (outer_frame_* and vent_*)
const targets = appendedSVG.querySelectorAll('[id^="outer_frame_"], [id^="vent_"],[id^="mullion_"], g[id^="handle_handle_"]');
targets.forEach(el => {
  if (el.id.startsWith('outer_frame_')) {
    el.style.fill = windowConfig.farbeInnenfill;
  }
  if (el.id.startsWith('vent_')) {
    el.style.fill = windowConfig.farbeInnenfill;
  }

  if (el.id.startsWith('mullion_')) {
    el.style.fill = windowConfig.farbeInnenfill;
  }

    if (el.id?.startsWith('handle_handle_')) {
    // update all paths inside the handle group
    el.querySelectorAll('path').forEach(path => {
      path.style.fill = windowConfig.griffhandel;
    });
  }

});




  // 🔥 re-draw measurements in the Tab 7 copy
  const vb = (clone.getAttribute('viewBox') || '').split(/\s+/).map(Number);
  const vbW = +clone.getAttribute('width')  || vb[2] || 400;
  const vbH = +clone.getAttribute('height') || vb[3] || 400;
 // drawSelectedMeasurements(clone, 0, 0, vbW, vbH, vbW, vbH);

   if (windowConfig.baseType === "selected") {
  // only for selected SVGs (sub-measurements)
  drawSelectedMeasurements(clone, 0, 0, vbW, vbH, vbW, vbH);
} else {
  // for DB SVGs, just clone — no sub-measurements
}
}

syncEffectiveHeightDisplays();
recomputeTotalPrice();

}


// ==================== SECTION DEPENDENCY HELPER ====================

function updateDependentSections(subtab) {
  if (!subtab || !Array.isArray(subtab.sections)) return;

  const activeIds = Object.values(selectedBySection).flat().map(String);

  subtab.sections.forEach(section => {
    const block = document.querySelector(`.section-block[data-section-id="${section.id}"]`);
    if (!block) return;

    const cards = Array.from(block.querySelectorAll('.card-option, .image-select-option-block, .text-input-option-block'));
    let visibleCount = 0;

    cards.forEach(card => {
      const optId = card.dataset.id;
      const optObj = (section.options || []).find(o => String(o.id) === String(optId));
      if (!optObj) return;

      const deps = (optObj.depends_on || '').split(',').map(s => s.trim()).filter(Boolean);
      // ✅ FIXED: show if ANY dependency matches, not all
      const visible = deps.length === 0 || deps.some(d => activeIds.includes(d));

      card.style.display = visible ? '' : 'none';
      card.style.opacity = visible ? '1' : '0.3';
      card.style.pointerEvents = visible ? 'auto' : 'none';

      if (visible) visibleCount++;
    });

    // ✅ Hide whole section if no visible cards
    block.style.display = visibleCount === 0 ? 'none' : '';
  });
}



// ==================== END DEPENDENCY HELPER ====================





// ========== TAB 7 ADD TO CART ==========
document.addEventListener("click", function(e) {
  if (windowConfig.rollladenOn && e.target.closest('button.btnmain-cart.cart')) {
    e.preventDefault();
    syncRollladenInquiryMode();
    const inquiryBox = document.querySelector('#tab7 .rollladen-inquiry-box') || document.querySelector('.rollladen-inquiry-box');
    openRollladenInquiryModal(inquiryBox);
    return;
  }

  const openButton = e.target.closest('.rollladen-inquiry-open');
  if (openButton) {
    e.preventDefault();
    openRollladenInquiryModal(openButton.closest('.rollladen-inquiry-box'));
    return;
  }

  const closeTarget = e.target.closest('[data-rollladen-close]');
  if (closeTarget) {
    e.preventDefault();
    closeRollladenInquiryModal(closeTarget.closest('.rollladen-inquiry-modal'));
    return;
  }

	 function addToCartWithProperties(variantId, item) {
  const properties = {
    "System": item.profile,
    "Typ": item.wing,
    "Öffnung": item.opening,
    "Beschlag": item.beschlag,
    "Breite (mm)": item.width,
    "Höhe (mm)": item.height,
    "Farbe innen": item.farbe_innen,
    "Farbe außen": item.farbe_aussen,
    "Griff": item.griff,
    "Isolierglas": item.isolierglas,
    "Ornament": item.ornament,
    "Dichtungen": item.dichtungen || "schwarz",
    "Fensterbank-Anschlussprofil": item.fensterbank,
    "Fensterbank Zusatzhöhe (mm)": item.fensterbank_add_height,
    "Sprosse": item.sprosse,
    "Sprosse H": item.sprosseh,
    "Sprosse V": item.sprossev,
	    "Rahmen": item.rahmen,
	    "Rahmen unten": item.rahmen_unten,
	    "Griff innen + Schnapper": item.griff_innen_schnapper,
	    "Lüfter": item.luefter,
    "Reedkontakt": item.reedkontakt,
    "Rollladen": item.rollladen
  };

  Object.keys(properties).forEach(key => {
    if (properties[key] === undefined || properties[key] === null || properties[key] === '') {
      delete properties[key];
    }
  });

  fetch("/cart/add.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      id: Number(variantId),
      quantity: item.qty || 1,
      properties: properties
    })
  })
  .then(res => res.json())
  .then(data => {

// ❌ HIDE LOADER
  hideLoader();

    if (data.status === 422) {
      alert(data.description || "Cart error");
    } else {
      window.location.href = "/cart";
    }
  })
  .catch(err => console.error("Cart add error:", err));
}

  // --------------- TAB 7 ----------------
  if (e.target && e.target.matches("#tab7 button.btnmain-cart.cart")) {
    const svgNode = document.querySelector("#tab7-svgPreviewBox svg");
	    if (svgNode) svgNode.setAttribute("style", "max-width:200px; max-height:200px;object-fit:fill;overflow:visible;");
	const mullion = svgNode?.querySelector("#mullion_1");
if (mullion) mullion.setAttribute("style", "display:none");
    const svgMarkup = svgNode ? new XMLSerializer().serializeToString(svgNode) : "";

	    const item = {
	      profile: windowConfig.profile,
      wing: windowConfig.wing,
      opening: windowConfig.opening,
      width: document.getElementById("t7-width")?.textContent,
      height: document.getElementById("t7-height")?.textContent,
      beschlag: window.beschlagLabel,
      farbe_innen: document.getElementById("t7-innen")?.textContent,
      farbe_aussen: document.getElementById("t7-aussen")?.textContent,
      griff: document.getElementById("t7-griff")?.textContent,
      isolierglas: document.getElementById("t7-isolierglas")?.textContent,
      ornament: document.getElementById("t7-ornament")?.textContent,
      fensterbank: document.getElementById("t7-sidebar-fensterbank")?.textContent,
      fensterbank_add_height: windowConfig.fensterbankAddHeight || undefined,
      rahmen: document.getElementById("t7-sidebar-rahmen")?.textContent,
      luefter: document.getElementById("t7-sidebar-luefter")?.textContent,
      reedkontakt: document.getElementById("t7-sidebar-reedkontakt")?.textContent,
	      rollladen: getRollladenDetailsText(),
      qty: currentQty,
	      price: document.getElementById("t7-price")?.textContent,
	      svg: svgMarkup
	    };
	    addBalconyDoorDetails(item);

	    fetch("https://droplify.de/deine-fenster24/shopify-create-product.php?shop=deine-fenster24-com.myshopify.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    })
    .then(res => res.json())
    .then(resp => {

      if (resp.success && resp.variantId) {

		  // 🔥 SHOW EXISTING LOADER
    showLoader();
          setTimeout(() => {
      addToCartWithProperties(resp.variantId, item);
    }, 6000); // 60000 ms = 1 minute
      } else {
        console.error("Shopify response:", resp);
      }
    })
    .catch(err => console.error("Cart error:", err));
  }

  // --------------- TAB 4 ----------------
  if (e.target && e.target.matches("#tab4 button.btnmain-cart.cart")) {
    const svgNode = document.querySelector("#tab4 #svgPreviewBox svg");
    if (svgNode) svgNode.setAttribute("style", "max-width:200px; max-height:200px;object-fit:fill;overflow:visible;");
	const mullion = svgNode?.querySelector("#mullion_1");
if (mullion) mullion.setAttribute("style", "display:none");
    const svgMarkup = svgNode ? new XMLSerializer().serializeToString(svgNode) : "";

	    const item = {
	      profile: windowConfig.profile,
      wing: windowConfig.wing,
      opening: windowConfig.opening,
      width: document.getElementById("sb-width")?.textContent,
      height: document.getElementById("sb-height")?.textContent,
      beschlag: document.getElementById("sb-beschlag")?.textContent,
      qty: currentQty,
	      price: document.getElementById("t7-price")?.textContent,
	      svg: svgMarkup
	    };
	    addBalconyDoorDetails(item);

	    fetch("https://droplify.de/deine-fenster24/shopify-create-product.php?shop=deine-fenster24-com.myshopify.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    })
    .then(res => res.json())
    .then(resp => {
      if (resp.success && resp.variantId) {
		  // 🔥 SHOW EXISTING LOADER
    showLoader();
          setTimeout(() => {
      addToCartWithProperties(resp.variantId, item);
    }, 6000); // 60000 ms = 1 minute
      } else {
        console.error("Shopify response:", resp);
      }
    })
    .catch(err => console.error("Cart error:", err));
  }

  // --------------- TAB 5 ----------------
  if (e.target && e.target.matches("#tab5 button.btnmain-cart.cart")) {
    const svgNode = document.querySelector("#glass-sidebar #svgPreviewBox svg");
    if (svgNode) svgNode.setAttribute("style", "max-width:200px; max-height:200px;object-fit:fill;overflow:visible;");
	const mullion = svgNode?.querySelector("#mullion_1");
if (mullion) mullion.setAttribute("style", "display:none");
    const svgMarkup = svgNode ? new XMLSerializer().serializeToString(svgNode) : "";

	    const item = {
	      profile: windowConfig.profile,
      wing: windowConfig.wing,
      opening: windowConfig.opening,
      width: document.getElementById("glass-sidebar-width")?.textContent,
      height: document.getElementById("glass-sidebar-height")?.textContent,
      beschlag: document.getElementById("glass-sidebar-beschlag")?.textContent,
      farbe_innen: document.getElementById("glass-sidebar-innen")?.textContent,
      farbe_aussen: document.getElementById("glass-sidebar-aussen")?.textContent,
      griff: document.getElementById("glass-sidebar-griff")?.textContent,
      isolierglas: document.getElementById("glass-sidebar-isolierglas")?.textContent,
      ornament: document.getElementById("glass-sidebar-ornament")?.textContent,
      qty: currentQty,
	      price: document.getElementById("glass-price")?.textContent,
	      svg: svgMarkup
	    };
	    addBalconyDoorDetails(item);

	    fetch("https://droplify.de/deine-fenster24/shopify-create-product.php?shop=deine-fenster24-com.myshopify.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    })
    .then(res => res.json())
    .then(resp => {
      if (resp.success && resp.variantId) {
		  // 🔥 SHOW EXISTING LOADER
    showLoader();
          setTimeout(() => {
      addToCartWithProperties(resp.variantId, item);
    }, 6000); // 60000 ms = 1 minute
      } else {
        console.error("Shopify response:", resp);
      }
    })
    .catch(err => console.error("Cart error:", err));
  }

  // --------------- TAB 6 ----------------
  if (e.target && e.target.matches("#tab6 button.btnmain-cart.cart")) {
    const svgNode = document.querySelector("#tab6 #svgPreviewBox svg");
    if (svgNode) svgNode.setAttribute("style", "max-width:200px; max-height:200px;object-fit:fill;overflow:visible;");
	const mullion = svgNode?.querySelector("#mullion_1");
if (mullion) mullion.setAttribute("style", "display:none");
    const svgMarkup = svgNode ? new XMLSerializer().serializeToString(svgNode) : "";

	    const item = {
	      profile: windowConfig.profile,
      wing: windowConfig.wing,
      opening: windowConfig.opening,
      width: document.getElementById("zubehoer-sidebar-width")?.textContent,
      height: document.getElementById("zubehoer-sidebar-height")?.textContent,
      beschlag: document.getElementById("zubehoer-sidebar-beschlag")?.textContent,
      farbe_innen: document.getElementById("zubehoer-sidebar-innen")?.textContent,
      farbe_aussen: document.getElementById("zubehoer-sidebar-aussen")?.textContent,
      griff: document.getElementById("zubehoer-sidebar-griff")?.textContent,
      isolierglas: document.getElementById("zubehoer-sidebar-isolierglas")?.textContent,
      ornament: document.getElementById("zubehoer-sidebar-ornament")?.textContent,
      fensterbank: document.getElementById("zubehoer-sidebar-fensterbank")?.textContent,
      fensterbank_add_height: windowConfig.fensterbankAddHeight || undefined,
      //sprosseh: document.getElementById("zubehoer-sidebar-sprosseH")?.textContent,
      //sprossev: document.getElementById("zubehoer-sidebar-sprosseV")?.textContent,
      rahmen: document.getElementById("zubehoer-sidebar-rahmen")?.textContent,
      luefter: document.getElementById("zubehoer-sidebar-luefter")?.textContent,
      reedkontakt: document.getElementById("zubehoer-sidebar-reedkontakt")?.textContent,
	      rollladen: getRollladenDetailsText(),
      qty: currentQty,
	      price: document.getElementById("zubehoer-price")?.textContent,
	      svg: svgMarkup
	    };
	    addBalconyDoorDetails(item);

	    fetch("https://droplify.de/deine-fenster24/shopify-create-product.php?shop=deine-fenster24-com.myshopify.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    })
    .then(res => res.json())
    .then(resp => {
      if (resp.success && resp.variantId) {
		  // 🔥 SHOW EXISTING LOADER
    showLoader();
         setTimeout(() => {
      addToCartWithProperties(resp.variantId, item);
    }, 6000); // 60000 ms = 1 minute
      } else {
        console.error("Shopify response:", resp);
      }
    })
    .catch(err => console.error("Cart error:", err));
  }

});

// ========== Remaining helpers and functions ==========
function getWingOpeningIDs() {
  const wing = document.querySelector('#tab2 .card-option.active')?.dataset.id;
  const opening = document.querySelector('#tab3 .card-option.active')?.dataset.id;
  return [wing, opening].filter(Boolean);
}
function getComboVariantsForSearch() {
  const arr = getWingOpeningIDs();
  let combos = [];
  if (staticCode && arr.length === 2) combos.push([staticCode, arr[0], arr[1]]);
  if (staticCode && arr.length === 1) combos.push([staticCode, arr[0]]);
  if (staticCode) combos.push([staticCode]);
  if (arr.length === 2) combos.push([arr[0], arr[1]]);
  if (arr.length === 1) combos.push([arr[0]]);
  combos = combos.filter((c, i, self) => i === self.findIndex(x => x.join(',') === c.join(',')));
  return combos;
}
function getCurrentPricingComboIds() {
  const profileId = getCurrentProfileId();
  const wingId = windowConfig.wingId;
  const openingId = windowConfig.openingId;

  if (!staticCode || !profileId || !wingId || !openingId) {
    return null;
  }

  return [
    String(staticCode),
    String(profileId),
    String(wingId),
    String(openingId)
  ];
}

function getCurrentPricingComboKey() {
  const comboIds = getCurrentPricingComboIds();
  return comboIds ? JSON.stringify(comboIds) : '';
}

function hasCachedPricingRows(comboKey) {
  return Object.prototype.hasOwnProperty.call(COMBO_ROWS_BY_KEY, comboKey);
}

function loadPricingRowsForCombo(comboKey) {
  if (!comboKey) return Promise.resolve([]);
  if (hasCachedPricingRows(comboKey)) return Promise.resolve(COMBO_ROWS_BY_KEY[comboKey]);
  if (COMBO_ROWS_PROMISES[comboKey]) return COMBO_ROWS_PROMISES[comboKey];

  const url = `https://droplify.de/deine-fenster24/admin/get-combos.php?combo_option_ids=${encodeURIComponent(comboKey)}`;

  COMBO_ROWS_PROMISES[comboKey] = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Price grid request failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      const rows = Array.isArray(data.height_width_prices) ? data.height_width_prices : [];
      COMBO_ROWS_BY_KEY[comboKey] = rows;
      return rows;
    })
    .catch(err => {
      delete COMBO_ROWS_PROMISES[comboKey];
      throw err;
    });

  return COMBO_ROWS_PROMISES[comboKey];
}

function getMatchingComboRows() {
  const comboIds = getCurrentPricingComboIds();
  if (!comboIds) return [];

  const comboKey = JSON.stringify(comboIds);
  if (hasCachedPricingRows(comboKey)) return COMBO_ROWS_BY_KEY[comboKey];

  return ALL_COMBOS.filter(row => {
    let ids;
    try {
      ids = JSON.parse(row.combo_option_ids).map(String);
    } catch (e) {
      return false;
    }

    if (ids.length !== comboIds.length) return false;

    return ids.every((id, idx) => id === comboIds[idx]);
  });

}



function findPriceForSize(combos, widthInput, heightInput) {
  const filtered = combos.filter(c => c.width <= widthInput && c.height <= heightInput);
  if (filtered.length === 0) return null;
  filtered.sort((a, b) => (b.width === a.width) ? (b.height - a.height) : (b.width - a.width));
  return filtered[0];
}

function setGroesseLoadingState(widthInput, heightInput) {
  widthInput.value = '';
  heightInput.value = '';
  widthInput.min = ''; widthInput.max = '';
  heightInput.min = ''; heightInput.max = '';
  widthInput.placeholder = 'Laden...';
  heightInput.placeholder = 'Laden...';
  widthInput.readOnly = true;
  heightInput.readOnly = true;
  widthInput.onfocus = heightInput.onfocus = null;
  widthInput.oninput = heightInput.oninput = null;
  widthInput.onchange = heightInput.onchange = null;
  widthInput.onblur = heightInput.onblur = null;
  widthInput.onkeydown = heightInput.onkeydown = null;

  const priceBox = document.querySelector('#tab4 .price-box .price');
  setSidebarPrice(priceBox, null, '-');
}

function updateGroesseDropdownsAndSidebar() {
  const widthInput  = document.getElementById('width');
  const heightInput = document.getElementById('height');
  if (!widthInput || !heightInput) return;

  const comboKey = getCurrentPricingComboKey();
  if (comboKey && !hasCachedPricingRows(comboKey)) {
    setGroesseLoadingState(widthInput, heightInput);

    loadPricingRowsForCombo(comboKey)
      .then(() => {
        if (getCurrentPricingComboKey() === comboKey) {
          updateGroesseDropdownsAndSidebar();
        }
      })
      .catch(err => {
        console.error('Price grid loading failed', err);
        COMBO_ROWS_BY_KEY[comboKey] = [];
        if (getCurrentPricingComboKey() === comboKey) {
          updateGroesseDropdownsAndSidebar();
        }
      });

    return;
  }

  const combos = getMatchingComboRows();
  widthInput.placeholder = '';
  heightInput.placeholder = '';

  // ---- NO DB ROWS: blank + readonly + alert on focus ----
  if (!combos || combos.length === 0) {
    widthInput.value = '';
    heightInput.value = '';
    widthInput.min = ''; widthInput.max = '';
    heightInput.min = ''; heightInput.max = '';

    widthInput.readOnly = true;
    heightInput.readOnly = true;

    // clear old listeners
    widthInput.oninput = heightInput.oninput = null;
    widthInput.onchange = heightInput.onchange = null;
    widthInput.onblur = heightInput.onblur = null;
    widthInput.onkeydown = heightInput.onkeydown = null;

    const focusAlert = () => {
      alert("Missing height/width in database");
      widthInput.blur(); heightInput.blur();
    };
    widthInput.onfocus = focusAlert;
    heightInput.onfocus = focusAlert;

    const priceBox = document.querySelector('#tab4 .price-box .price');
    setSidebarPrice(priceBox, null, '-');
    const sbW = document.getElementById('sb-width');  if (sbW) sbW.textContent = '';
    const sbH = document.getElementById('sb-height'); if (sbH) sbH.textContent = '';
    return;
  }

  // ---- DB ROWS EXIST: unlock + use DB bounds; allow freehand within range ----
  widthInput.readOnly = false;
  heightInput.readOnly = false;

  widthInput.onfocus = null;
  heightInput.onfocus = null;

  const nums = (arr) => arr.map(Number).filter(n => Number.isFinite(n));
  const allWidths  = nums(combos.map(c => c.width));
  const allHeights = nums(combos.map(c => c.height));

  if (!allWidths.length || !allHeights.length) {
    // Treat as no DB
    widthInput.value = '';
    heightInput.value = '';
    widthInput.readOnly = true;
    heightInput.readOnly = true;
    const fallbackAlert = () => {
      alert("Missing height/width in database");
      widthInput.blur(); heightInput.blur();
    };
    widthInput.onfocus = fallbackAlert;
    heightInput.onfocus = fallbackAlert;
    const priceBox = document.querySelector('#tab4 .price-box .price');
    setSidebarPrice(priceBox, null, '-');
    const sbW = document.getElementById('sb-width');  if (sbW) sbW.textContent = '';
    const sbH = document.getElementById('sb-height'); if (sbH) sbH.textContent = '';
    return;
  }

  const minW = Math.min(...allWidths);
  const maxW = Math.max(...allWidths);
  const minH = Math.min(...allHeights);
  const maxH = Math.max(...allHeights);

  widthInput.min = String(minW);
  widthInput.max = String(maxW);
  widthInput.step = '1';

  heightInput.min = String(minH);
  heightInput.max = String(maxH);
  heightInput.step = '1';

  // Defaults from DB min if empty or out-of-range
  if (!widthInput.value || +widthInput.value < minW || +widthInput.value > maxW) {
    widthInput.value = String(minW);
  }
  if (!heightInput.value || +heightInput.value < minH || +heightInput.value > maxH) {
    heightInput.value = String(minH);
  }

  // ---- Validation (no alert while typing; alert only on blur/change/Enter) ----
  function clampWithAlert(el, min, max, label) {
    const val = +el.value;
    if (!Number.isFinite(val)) return;
    if (val < min) {
      alert(`Please don't exceed the limit of ${label}.\nAllowed range: **${min} - ${max}**`);
      el.value = String(min);
    } else if (val > max) {
      alert(`Please don't exceed the limit of ${label}.\nAllowed range: **${min} - ${max}**`);
      el.value = String(max);
    }
  }

  // Clear old listeners
  widthInput.oninput = heightInput.oninput = null;
  widthInput.onchange = heightInput.onchange = null;
  widthInput.onblur = heightInput.onblur = null;
  widthInput.onkeydown = heightInput.onkeydown = null;
  // Width: live update only; enforce on blur/change/Enter
  widthInput.oninput = () => {
    // no alert, no snapping inside range
    updateTab4PriceAndSVGFromCombo(getMatchingComboRows());
  };
  widthInput.onchange = () => {
    clampWithAlert(widthInput, minW, maxW, "width");
    updateTab4PriceAndSVGFromCombo(getMatchingComboRows());
  };
  widthInput.onblur = () => {
    clampWithAlert(widthInput, minW, maxW, "width");
    updateTab4PriceAndSVGFromCombo(getMatchingComboRows());
  };
  widthInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      clampWithAlert(widthInput, minW, maxW, "width");
      updateTab4PriceAndSVGFromCombo(getMatchingComboRows());
    }
  };

  // Height: live update only; enforce on blur/change/Enter
  heightInput.oninput = () => {
    // no alert, no snapping inside range
    updateTab4PriceAndSVGFromCombo(getMatchingComboRows());
  };
  heightInput.onchange = () => {
    clampWithAlert(heightInput, minH, maxH, "height");
    updateTab4PriceAndSVGFromCombo(getMatchingComboRows());
  };
  heightInput.onblur = () => {
    clampWithAlert(heightInput, minH, maxH, "height");
    updateTab4PriceAndSVGFromCombo(getMatchingComboRows());
  };
  heightInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      clampWithAlert(heightInput, minH, maxH, "height");
      updateTab4PriceAndSVGFromCombo(getMatchingComboRows());
    }
  };

  // Initial compute with DB-backed defaults
  updateTab4PriceAndSVGFromCombo(combos);
}




function updateTab4PriceAndSVGFromCombo(combos) {
  const priceBox = document.querySelector('#tab4 .price-box .price');

  let widthVal = parseInt(document.getElementById('width').value, 10);
  let heightVal = parseInt(document.getElementById('height').value, 10);

  if (!combos || combos.length === 0 || isNaN(widthVal) || isNaN(heightVal)) {
    setSidebarPrice(priceBox, null, '-');
    document.getElementById('sb-width').textContent = '';
    document.getElementById('sb-height').textContent = '';
    return;
  }

  const tier = findPriceForSize(combos, widthVal, heightVal);

  if (tier) {
    basePriceTab4 = parseFloat(tier.price) || 0;
    document.getElementById('sb-width').textContent = widthVal;
    document.getElementById('sb-height').textContent = heightVal;
  } else {
    basePriceTab4 = 0;
    setSidebarPrice(priceBox, null, '-');
  }

  // update SVG for Tab 4
  updateTab4SVG({ width: widthVal, height: heightVal, modify: true });

  // ✅ always recalc for all tabs
  refreshAreaBasedPrices();
  recomputeTotalPrice();
  syncEffectiveHeightDisplays();


}


function update_svg_4to7(){
  const liveSVG = document.querySelector('#tab4 #svgPreviewBox svg');
  const targets = [
    document.querySelector('#tab5 #svgPreviewBox'),
    document.querySelector('#tab6 #svgPreviewBox')
  ];

  if (liveSVG && targets.every(Boolean)) {
    targets.forEach(target => {
      target.innerHTML = '';
      const clone = liveSVG.cloneNode(true);
      target.appendChild(clone);

      const appendedSVG = target.querySelector('svg');

      // ✅ Inject saved <defs>
      if (windowConfig.farbeInnenDefs) {
    // does the cloned SVG already have a <defs>?
    let defsNode = appendedSVG.querySelector('defs');
    if (!defsNode) {
      defsNode = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      appendedSVG.insertBefore(defsNode, appendedSVG.firstChild);
    }

    defsNode.innerHTML += windowConfig.farbeInnenDefs;
// ROLLLADEN head box → draw if feature is ON
drawRollladenBox(appendedSVG, !!windowConfig.rollladenOn);


  }

      // ✅ Apply fills to inner/outer
      const inner = appendedSVG.querySelector('#inner');
      if (inner) inner.style.fill = windowConfig.farbeInnenfill;

      const outer = appendedSVG.querySelector('#outer');
      if (outer) outer.style.fill = windowConfig.farbeInnenfill;

      // ✅ Apply fills to dynamic SVG parts
      const dynamicParts = appendedSVG.querySelectorAll('[id^="outer_frame_"], [id^="vent_"], [id^="mullion_"], g[id^="handle"], g[id^="right-handle"], g[id^="left-handle"]');
      dynamicParts.forEach(el => {
        if (el.id?.startsWith('outer_frame_') || el.id?.startsWith('vent_') || el.id?.startsWith('mullion_')) {
          el.style.fill = windowConfig.farbeInnenfill;
        }

        if (el.id?.startsWith('handle')) {
          el.querySelectorAll('path').forEach(path => {
            path.style.fill = windowConfig.griffhandel;
          });
        }

 if (el.id?.startsWith('right-handle')) {
          el.querySelectorAll('path').forEach(path => {
            path.style.fill = windowConfig.griffhandel;
          });
        }

      });
    });
  }


}



// ==== ROLLLADEN BOX HELPERS ====
function getOuterBBoxGeneric(svg) {
  const outer = svg.querySelector('#outer');
  if (outer) {
    try { const b = outer.getBBox(); return { x:b.x, y:b.y, w:b.width, h:b.height }; } catch {}
    return {
      x: +outer.getAttribute('x') || 0,
      y: +outer.getAttribute('y') || 0,
      w: +outer.getAttribute('width')  || (+svg.getAttribute('width')  || 160),
      h: +outer.getAttribute('height') || (+svg.getAttribute('height') || 160)
    };
  }

  const ids = ['outer_frame_1','outer_frame_2','outer_frame_3','outer_frame_4'];
  const els = ids.map(id => svg.querySelector(`#${CSS.escape(id)}`)).filter(Boolean);
  if (els.length) {
    let box = null;
    els.forEach(el => {
      try {
        const b = el.getBBox();
        if (!b || (!b.width && !b.height)) return;
        if (!box) box = { x:b.x, y:b.y, x2:b.x+b.width, y2:b.y+b.height };
        else {
          box.x  = Math.min(box.x, b.x);
          box.y  = Math.min(box.y, b.y);
          box.x2 = Math.max(box.x2, b.x + b.width);
          box.y2 = Math.max(box.y2, b.y + b.height);
        }
      } catch {}
    });
    if (box) return { x: box.x, y: box.y, w: box.x2 - box.x, h: box.y2 - box.y };
  }

  const vb = (svg.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
  return { x: vb[0] || 0, y: vb[1] || 0, w: vb[2] || (+svg.getAttribute('width')  || 160), h: vb[3] || (+svg.getAttribute('height') || 160) };
}
/****
function drawRollladenBox(svg, enabled) {
  if (!svg) return;
  const OLD = svg.querySelector('#rollladen_box');
  if (OLD) OLD.remove();
  if (!enabled) return;

  const ob = getOuterBBoxGeneric(svg);
  const H = Math.max(20, Math.min(620, ob.h * 0.15));
  const GAP = 0;
  const x = ob.x;
  const y = ob.y - H - GAP;
  const w = ob.w;
  const h = H;


  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('id','rollladen_box');

  const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width',  Math.max(1, w));
  rect.setAttribute('height', Math.max(1, h));
  rect.setAttribute('fill', '#FFFFFF');
  rect.setAttribute('stroke', '#000000');
  rect.setAttribute('stroke-width', '1');
  g.appendChild(rect);


// 🔹 choose where to append
  const targetGroup =
    svg.querySelector('#__selectedScaleGroup') ||  // change this ID to your actual inner <g>
svg;

  targetGroup.appendChild(g);
}


***/

function drawRollladenBox(svg, enabled) {
  if (!svg) return;

  // ❌ remove old box
  const old = svg.querySelector('#rollladen_box');
  if (old) old.remove();

  if (!enabled) return;

  // ✅ GET REAL SVG SIZE FROM viewBox
  const vb = svg.viewBox.baseVal;

  const width = vb.width;
  const height = vb.height;

  // fallback if no viewBox
  const finalWidth = width || svg.width.baseVal.value;
  const finalHeight = height || svg.height.baseVal.value;

  // 🔥 BOX DIMENSIONS (TOP STRIP)
  const boxHeight = finalHeight * 0.15 - 30 ; // 15% height
  const boxWidth = finalWidth;          // FULL WIDTH

  // CREATE RECT
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  rect.setAttribute('id', 'rollladen_box');
  rect.setAttribute('x', 0);
  rect.setAttribute('y', -60);
  rect.setAttribute('width', boxWidth);
  rect.setAttribute('height', boxHeight);
  rect.setAttribute('fill', '#FFFFFF');

  svg.appendChild(rect);
}


function updateTab5Sidebar() {

	 // ===== TAB 1 =====
  document.getElementById('glass-sidebar-profile').textContent =
    windowConfig.profile || '';

	 // ===== TAB 2 =====
  document.getElementById('glass-sidebar-wing').textContent =
    windowConfig.wing || '';

	  // ===== TAB 3 =====
  document.getElementById('glass-sidebar-opening').textContent =
    windowConfig.opening || '';

	  // ===== TAB 4 =====
  document.getElementById('glass-sidebar-beschlag').textContent =
    beschlagLabel || '';

	  // --- carry values into Tab 5 sidebar ---

	    // SIZE (Tab 4 inputs)
  document.getElementById('glass-sidebar-width').textContent =
    document.getElementById('width')?.value || '';

  document.getElementById('glass-sidebar-height').textContent =
    document.getElementById('height')?.value || '';

  const glassBalconyNotes = document.getElementById('glass-sidebar-balkon-notes');
  if (glassBalconyNotes) glassBalconyNotes.innerHTML = getBalconyDoorNotesHTML();


  // Size + Beschlag from Tab4
  document.getElementById('zubehoer-sidebar-width').textContent   = document.getElementById('sb-width')?.textContent || '';
  document.getElementById('zubehoer-sidebar-height').textContent  = document.getElementById('sb-height')?.textContent || '';
  document.getElementById('zubehoer-sidebar-beschlag').textContent= beschlagLabel || '';

  update_svg_4to7();
  // Update prices
  recomputeTotalPrice();
}

// ========== TAB 6 → ROLLLADEN SIDEBAR BUILDER ==========
// ========== ROLLLADEN SIDEBAR BUILDER (final safe version) ==========
let rollladenStore = {};
let rollladenSystemChosen = false;

function updateTab6SidebarRollladen() {
  const box = document.getElementById('zubehoer-sidebar-rollladen');
  if (!box) return;

  // clear sidebar section
  box.innerHTML = '';

  // don’t render anything until System is selected
  if (!rollladenSystemChosen) return;

  // --- Verschattung (width × height) ---
  const w =
    rollladenStore['Breite (mm)'] ||
    rollladenStore['Breite'] ||
    document.querySelector('#rollladen-subtab input[placeholder*="Breite"]')?.value ||
    '';
  const h =
    rollladenStore['Höhe (mm)'] ||
    rollladenStore['Hoehe'] ||
    document.querySelector('#rollladen-subtab input[placeholder*="Höhe"], #rollladen-subtab input[placeholder*="Hoehe"]')?.value ||
    '';

  if (w || h) {
    const line = document.createElement('div');
    line.className = 'rollladen-line';
    line.innerHTML = `<br><br>Verschattung: ${w || '-'} × ${h || '-'} mm`;
    box.appendChild(line);
  }

  // --- all other selected dropdowns ---
  Object.entries(rollladenStore)
    .filter(([key, val]) => val && !/breite|höhe|hoehe/i.test(key))
    .sort(([a]) => (a.toLowerCase().includes('system') ? -1 : 1))
    .forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'rollladen-line';
      row.innerHTML = `<strong>${label}:</strong> ${value}`;
      box.appendChild(row);
    });
}


function updateTab6Sidebar() {
  // Profile/Wing/Opening from global state
  document.getElementById('zubehoer-sidebar-profile').textContent = windowConfig.profile || '';
  document.getElementById('zubehoer-sidebar-wing').textContent    = windowConfig.wing || '';
  document.getElementById('zubehoer-sidebar-opening').textContent = windowConfig.opening || '';

  // Size + Beschlag from Tab4
  document.getElementById('zubehoer-sidebar-width').textContent   = document.getElementById('sb-width')?.textContent || '';
  document.getElementById('zubehoer-sidebar-height').textContent  = document.getElementById('sb-height')?.textContent || '';
  document.getElementById('zubehoer-sidebar-beschlag').textContent= beschlagLabel || '';

  // Tab5 extras (colors, glass, griff, ornament)
  document.getElementById('zubehoer-sidebar-innen').textContent      = document.getElementById('glass-sidebar-innen')?.textContent || '';
  document.getElementById('zubehoer-sidebar-aussen').textContent     = document.getElementById('glass-sidebar-aussen')?.textContent || '';
  document.getElementById('zubehoer-sidebar-griff').textContent      = document.getElementById('glass-sidebar-griff')?.textContent || '';
  document.getElementById('zubehoer-sidebar-isolierglas').textContent= document.getElementById('glass-sidebar-isolierglas')?.textContent || '';
  document.getElementById('zubehoer-sidebar-ornament').textContent   = document.getElementById('glass-sidebar-ornament')?.textContent || '';
  const fensterbankSidebar = document.getElementById('zubehoer-sidebar-fensterbank');
  if (fensterbankSidebar) fensterbankSidebar.textContent = getSillProfileSummary();
  const zubehoerBalconyNotes = document.getElementById('zubehoer-sidebar-balkon-notes');
  if (zubehoerBalconyNotes) zubehoerBalconyNotes.innerHTML = getBalconyDoorNotesHTML();

  update_svg_4to7();

  // --- 🧩 ROLLLADEN summary block ---
  const rollSidebar = document.getElementById('zubehoer-sidebar-rollladen');
  if (!rollSidebar) return;
  const rollladenHTML = getRollladenDetailsHTML();
  rollSidebar.innerHTML = rollladenHTML;

  // 🔹 only show if system is selected
  if (!rollladenHTML) {
    rollSidebar.style.display = 'none';
    recomputeTotalPrice();
    syncRollladenInquiryMode();
    return;
  } else {
    rollSidebar.style.display = 'block';
  }

  recomputeTotalPrice();
  syncRollladenInquiryMode();
  return;

  // --- collect all extra (input + select) entries ---
  const extraEntries = [];
  for (const [key, val] of Object.entries(windowConfig)) {
    if (!val) continue;

    if (key.startsWith('input_')) {
      const id = key.replace('input_', '');
      const label = windowConfig[`input_label_${id}`] || '';
      extraEntries.push({ label, value: val });
    }

    if (key.startsWith('select_') && !key.startsWith('select_label_')) {
      const id = key.replace('select_', '');
      const label = windowConfig[`select_label_${id}`] || '';
      extraEntries.push({ label, value: val });
    }
  }

  // --- deduplicate ---
  const seen = new Set();
  const uniqueEntries = extraEntries.filter(e => {
    if (!e.label) return false;
    if (seen.has(e.label)) return false;
    seen.add(e.label);
    return true;
  });

  // --- find Breite + Höhe for both Verschattung and Abmessungen ---
  let widthVal = null, heightVal = null;
  uniqueEntries.forEach(e => {
    const l = e.label.toLowerCase();
    if (l.includes('breite')) widthVal = e.value;
    if (l.includes('höhe') || l.includes('hoehe') || l.includes('height')) heightVal = e.value;
  });

  // 🔹 static Verschattung line
  if (widthVal && heightVal) {
    const verschLine = document.createElement('div');
    verschLine.className = 'rollladen-sidebar-line verschattung-line';
    verschLine.innerHTML = `<br><br>Verschattung: ${widthVal} × ${heightVal} mm`;
    rollSidebar.appendChild(verschLine);
  }

  // --- normal card-based selections ---
  const tab6 = GLOBAL_TABS.find(t => String(t.id) === '6');
  const rollSubtab = tab6?.subtabs?.find(st => st.name.toLowerCase().includes('rollladen'));

  if (rollSubtab && Array.isArray(rollSubtab.sections)) {
    rollSubtab.sections.forEach(section => {
      const selectedKey = `${rollSubtab.id}_${section.id}`;
      const selectedId = selectedBySection[selectedKey];
      const selectedOpt = section.options?.find(o => String(o.id) === String(selectedId));

      if (selectedOpt) {
        const line = document.createElement('div');
        line.className = 'rollladen-sidebar-line';
        line.innerHTML = `${section.name}: ${getRollladenDisplayLabel(selectedOpt)}`;
        rollSidebar.appendChild(line);
      }
    });
  }

  // 🔹 dynamic Abmessungen line (same input values)
  if (widthVal && heightVal) {
    const dimLine = document.createElement('div');
    dimLine.className = 'rollladen-sidebar-line';
    dimLine.innerHTML = `Abmessungen: ${widthVal} × ${heightVal} mm`;
    rollSidebar.appendChild(dimLine);
  }

  // --- other extra fields except Breite/Höhe ---
  uniqueEntries.forEach(entry => {
    const l = entry.label.toLowerCase();
    if (l.includes('breite') || l.includes('höhe') || l.includes('hoehe') || l.includes('height')) return;
    const line = document.createElement('div');
    line.className = 'rollladen-sidebar-line';
    line.innerHTML = `${entry.label}:${entry.value}`;
    rollSidebar.appendChild(line);
  });

  recomputeTotalPrice();
}












function nextTab() {
  const tabs = document.querySelectorAll('.tab-link');
  let nextIndex = currentTab + 1;
  while (nextIndex < tabs.length && (tabs[nextIndex].classList.contains('disabled') || tabs[nextIndex].offsetParent === null)) nextIndex++;
  if (nextIndex < tabs.length) {
    if (tabs[nextIndex].classList.contains('disabled')) enableTabByIndex(nextIndex);
    switchTab(nextIndex);
    scrollToTabTop(); // 🔥 Add this
  }
 scrollToTabTop(); // 🔥 Add this

}

function prevTab() {
  const tabs = document.querySelectorAll('.tab-link');
  let prevIndex = currentTab - 1;
  while (prevIndex >= 0 && (tabs[prevIndex].classList.contains('disabled') || tabs[prevIndex].offsetParent === null)) prevIndex--;
  if (prevIndex >= 0) {
    if (tabs[prevIndex].classList.contains('disabled')) enableTabByIndex(prevIndex);
    switchTab(prevIndex);
    scrollToTabTop(); // 🔥 Add this
  }
 scrollToTabTop(); // 🔥 Add this

}




// ======= DB RESIZER (unchanged) =======
function updateSVGPreviewTab4(dynamicWidth, dynamicHeight) {
  const svg = document.querySelector('#tab4 #svgPreviewBox svg');
  if (!svg) return;

  const outer = svg.querySelector('#outer');
  const inner = svg.querySelector('#inner');
  const main  = svg.querySelector('#main');
  const bottom = svg.querySelector('#bottom');
  const polyGroup = svg.querySelector('#polylineGroup');
  const fixed = svg.querySelector('#fixed');
  const leftHandle = svg.querySelector('#left-handle');
  const rightHandle = svg.querySelector('#right-handle');

  if (!outer || !inner || !main || !bottom || !fixed || !leftHandle || !rightHandle) return;

  function parseMatrix(str) {
    const m = str && str.match(/matrix\(([-0-9.eE+, ]+)\)/);
    if (!m) return { a:1,b:0,c:0,d:1,e:0,f:0 };
    const [a,b,c,d,e,f] = m[1].split(',').map(v=>+v.trim());
    return { a,b,c,d,e,f };
  }
  function invertMatrix({a,b,c,d,e,f}) {
    const det = a*d - b*c || 1e-12;
    return { a: d/det, b:-b/det, c:-c/det, d: a/det, e:(c*f - d*e)/det, f:(b*e - a*f)/det };
  }
  function applyMatrix(m, x, y) { return { x: m.a*x + m.c*y + m.e, y: m.b*x + m.d*y + m.f }; }
  const clampPos = v => Math.max(1, v);

  function getLiveBBoxOrFallback(groupEl, mainEl, cache) {
    let live = null;
    try { live = groupEl ? groupEl.getBBox() : null; } catch (_) { live = null; }
    const good = live && (live.width > 0 || live.height > 0);
    if (good) { cache.lastGood = live; return live; }
    if (cache.lastGood) return cache.lastGood;
    return { x: +mainEl.getAttribute('x'), y: +mainEl.getAttribute('y'), width:+mainEl.getAttribute('width'), height:+mainEl.getAttribute('height') };
  }

  if (!updateSVGPreviewTab4.__base) {
    const vbRaw = (svg.getAttribute('viewBox') || '').trim();
    let vbMinX, vbMinY, vbW, vbH;
    if (vbRaw) {
      const parts = vbRaw.split(/\s+/).map(Number);
      [vbMinX, vbMinY, vbW, vbH] = parts.length === 4 ? parts : [0, 0, +svg.getAttribute('width'), +svg.getAttribute('height')];
    } else {
      vbMinX = 0; vbMinY = 0;
      vbW = +svg.getAttribute('width');
      vbH = +svg.getAttribute('height');
      svg.setAttribute('viewBox', `${vbMinX} ${vbMinY} ${vbW} ${vbH}`);
    }
    const hadViewBox = !!vbRaw;

    const polyTransform = polyGroup ? (polyGroup.getAttribute('transform') || '') : '';

    const base = {
      svgW: +svg.getAttribute('width'),
      svgH: +svg.getAttribute('height'),
      vbMinX, vbMinY, vbW, vbH,
      hadViewBox,
      outer: { x:+outer.getAttribute('x'), y:+outer.getAttribute('y'), w:+outer.getAttribute('width'), h:+outer.getAttribute('height') },
      inner: { x:+inner.getAttribute('x'), y:+inner.getAttribute('y'), w:+inner.getAttribute('width'), h:+inner.getAttribute('height') },
      main:  { x:+main.getAttribute('x'),  y:+main.getAttribute('y'),  w:+main.getAttribute('width'),  h:+main.getAttribute('height') },
      bottom:{ x:+bottom.getAttribute('x'),y:+bottom.getAttribute('y'),w:+bottom.getAttribute('width'),h:+bottom.getAttribute('height') },
      padLeft: +outer.getAttribute('x'),
      padTop:  +outer.getAttribute('y'),
      padRight: (+svg.getAttribute('width'))  - (+outer.getAttribute('x') + +outer.getAttribute('width')),
      padBot:   (+svg.getAttribute('height')) - (+outer.getAttribute('y') + +outer.getAttribute('height')),
      polyTransform,
      fixedMatrix: parseMatrix(fixed.getAttribute('transform') || 'matrix(1,0,0,1,0,0)'),
      leftHandleMatrix: parseMatrix(leftHandle.getAttribute('transform') || 'matrix(1,0,0,1,0,0)'),
      rightHandleMatrix: parseMatrix(rightHandle.getAttribute('transform') || 'matrix(1,0,0,1,0,0)')
    };
    base.fixedInv = invertMatrix(base.fixedMatrix);
    base.bottomOffsetFromOuterBottom = base.bottom.y - (base.outer.y + base.outer.h);
    base.fixedLines = Array.from(fixed.querySelectorAll('line'));

    function d2(a,b){const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy;}
    function toFixedLocal(pt){ return applyMatrix(base.fixedInv, pt.x, pt.y); }
    function outerCorners(w,h){ const x=base.outer.x, y=base.outer.y; return { TL:{x,y}, TR:{x:x+w,y}, BL:{x,y:y+h}, BR:{x:x+w,y:y+h} }; }
    const c0 = outerCorners(base.outer.w, base.outer.h);
    const TL0 = toFixedLocal(c0.TL), TR0 = toFixedLocal(c0.TR), BL0 = toFixedLocal(c0.BL), BR0 = toFixedLocal(c0.BR);

    base.lineData = base.fixedLines.map((ln) => {
      const p1 = {x:+ln.getAttribute('x1'), y:+ln.getAttribute('y1')};
      const p2 = {x:+ln.getAttribute('x2'), y:+ln.getAttribute('y2')};
      const p1Min = Math.min(d2(p1,TL0), d2(p1,TR0), d2(p1,BL0), d2(p1,BR0));
      const p2Min = Math.min(d2(p2,TL0), d2(p2,TR0), d2(p2,BL0), d2(p2,BR0));
      const cornerAtP1 = p1Min <= p2Min;
      const cornerPt = cornerAtP1 ? p1 : p2;
      const otherPt  = cornerAtP1 ? p2 : p1;
      const distances = { TL:d2(cornerPt,TL0), TR:d2(cornerPt,TR0), BL:d2(cornerPt,BL0), BR:d2(cornerPt,BR0) };
      const cornerName = Object.keys(distances).reduce((a,b)=> distances[a] < distances[b] ? a : b);
      const vx = otherPt.x - cornerPt.x;
      const vy = otherPt.y - cornerPt.y;
      return { cornerName, cornerAtP1, vx, vy };
    });

    updateSVGPreviewTab4.__base = base;
  }

  const base = updateSVGPreviewTab4.__base;

  function drawMeasurements() {
    let old = document.getElementById('measurements');
  if (old) old.remove();

  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('id','measurements');

  const ox = +outer.getAttribute('x');
  const oy = +outer.getAttribute('y');
  const ow = +outer.getAttribute('width');
  const oh = +outer.getAttribute('height');

  // 🔥 scale factor based on current outer size
  const scaleFactor = Math.max(ow, oh) / 600;   // 500 = reference, tweak if too big/small
  const fontSize    = 20 * scaleFactor;         // base 18px font
  const bgW         = 20 * scaleFactor;         // base 40px background width
  const bgH         = 28 * scaleFactor;         // base 28px background height

  const textStyle = `fill:black; font-size:${fontSize}px; font-family:Arial; dominant-baseline:middle; text-anchor:middle;`;

    const L = document.createElementNS('http://www.w3.org/2000/svg','line');
    L.setAttribute('x1', ox - 30); L.setAttribute('x2', ox - 30);
    L.setAttribute('y1', oy); L.setAttribute('y2', oy + oh);
    L.setAttribute('stroke', '#000'); g.appendChild(L);

    const leftBG = document.createElementNS('http://www.w3.org/2000/svg','rect');
    leftBG.setAttribute('x', ox - 50);
    leftBG.setAttribute('y', oy + oh/2 - 14);
    leftBG.setAttribute('width', 40);
    leftBG.setAttribute('height', 28);
    leftBG.setAttribute('fill', '#F4F4F4'); g.appendChild(leftBG);

    const Lt = document.createElementNS('http://www.w3.org/2000/svg','text');
    Lt.setAttribute('x', ox - 32); Lt.setAttribute('y', oy + oh/2);
    Lt.setAttribute('style', textStyle);
    Lt.textContent = Math.round(oh); g.appendChild(Lt);

    const R = document.createElementNS('http://www.w3.org/2000/svg','line');
    R.setAttribute('x1', ox + ow + 30); R.setAttribute('x2', ox + ow + 30);
    R.setAttribute('y1', oy); R.setAttribute('y2', oy + oh + 15);
    R.setAttribute('stroke', '#000'); g.appendChild(R);

    const rightBG = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rightBG.setAttribute('x', ox + ow + 12);
    rightBG.setAttribute('y', oy + oh/2 - 14);
    rightBG.setAttribute('width', 40);
    rightBG.setAttribute('height', 28);
    rightBG.setAttribute('fill', '#F4F4F4'); g.appendChild(rightBG);

    const Rt = document.createElementNS('http://www.w3.org/2000/svg','text');
    Rt.setAttribute('x', ox + ow + 32); Rt.setAttribute('y', oy + oh/2);
    Rt.setAttribute('style', textStyle);
    Rt.textContent = Math.round(oh + 30); g.appendChild(Rt);

    const B = document.createElementNS('http://www.w3.org/2000/svg','line');
    B.setAttribute('x1', ox); B.setAttribute('x2', ox + ow);
    B.setAttribute('y1', oy + oh + 45); B.setAttribute('y2', oy + oh + 45);
    B.setAttribute('stroke', '#000'); g.appendChild(B);

    const bottomBG = document.createElementNS('http://www.w3.org/2000/svg','rect');
    bottomBG.setAttribute('x', ox + ow/2 - 20);
    bottomBG.setAttribute('y', oy + oh + 30);
    bottomBG.setAttribute('width', 40);
    bottomBG.setAttribute('height', 28);
    bottomBG.setAttribute('fill', '#F4F4F4'); g.appendChild(bottomBG);

    const Bt = document.createElementNS('http://www.w3.org/2000/svg','text');
    Bt.setAttribute('x', ox + ow/2); Bt.setAttribute('y', oy + oh + 45);
    Bt.setAttribute('style', textStyle);
    Bt.textContent = Math.round(ow); g.appendChild(Bt);

    svg.appendChild(g);
  }

  function applyResizeByOuter(targetOuterW, targetOuterH) {
    const newSvgW = Math.max(1, base.padLeft + targetOuterW + base.padRight);
    const newSvgH = Math.max(1, base.padTop  + targetOuterH + base.padBot);

    svg.setAttribute('width',  newSvgW);
    svg.setAttribute('height', newSvgH);
    if (!base.hadViewBox) svg.setAttribute('viewBox', `${base.vbMinX} ${base.vbMinY} ${newSvgW} ${newSvgH}`);

    const dOuterW = (targetOuterW - base.outer.w);
    const dOuterH = (targetOuterH - base.outer.h);

    outer.setAttribute('width',  Math.max(1, base.outer.w + dOuterW));
    outer.setAttribute('height', Math.max(1, base.outer.h + dOuterH));

    inner.setAttribute('width',  Math.max(1, base.inner.w + dOuterW));
    inner.setAttribute('height', Math.max(1, base.inner.h + dOuterH));

    main.setAttribute('width',   Math.max(1, base.main.w  + dOuterW));
    main.setAttribute('height',  Math.max(1, base.main.h  + dOuterH));

    const newOuterBottom = base.outer.y + targetOuterH;
    bottom.setAttribute('y', newOuterBottom + base.bottomOffsetFromOuterBottom);
    bottom.setAttribute('width', Math.max(1, base.bottom.w + dOuterW));

    if (!updateSVGPreviewTab4.__polyBBoxCache) updateSVGPreviewTab4.__polyBBoxCache = {};
    const bbox = getLiveBBoxOrFallback(polyGroup, main, updateSVGPreviewTab4.__polyBBoxCache);

    const scaleX = (base.main.w + dOuterW) / base.main.w;
    const scaleY = (base.main.h + dOuterH) / base.main.h;

    const cx = bbox.x;
    const cy = bbox.y;

    if (polyGroup) {
      polyGroup.setAttribute(
        'transform',
        `${base.polyTransform} translate(${cx}, ${cy}) scale(${scaleX}, ${scaleY}) translate(${-cx}, ${-cy})`
      );
    }

    const newLeftMatrix  = { ...base.leftHandleMatrix };
    const newRightMatrix = { ...base.rightHandleMatrix };
    newLeftMatrix.f  += dOuterH / 2;
    newRightMatrix.f += dOuterH / 2;
    newRightMatrix.e += dOuterW;
    leftHandle.setAttribute('transform', `matrix(${newLeftMatrix.a},${newLeftMatrix.b},${newLeftMatrix.c},${newLeftMatrix.d},${newLeftMatrix.e},${newLeftMatrix.f})`);
    rightHandle.setAttribute('transform', `matrix(${newRightMatrix.a},${newRightMatrix.b},${newRightMatrix.c},${newRightMatrix.d},${newRightMatrix.e},${newRightMatrix.f})`);

    function toFixedLocal(pt){ return applyMatrix(base.fixedInv, pt.x, pt.y); }
    const corners = {
      TL:{ x: base.outer.x,                 y: base.outer.y },
      TR:{ x: base.outer.x + targetOuterW,  y: base.outer.y },
      BL:{ x: base.outer.x,                 y: base.outer.y + targetOuterH },
      BR:{ x: base.outer.x + targetOuterW,  y: base.outer.y + targetOuterH }
    };
    const TL = toFixedLocal(corners.TL);
    const TR = toFixedLocal(corners.TR);
    const BL = toFixedLocal(corners.BL);
    const BR = toFixedLocal(corners.BR);

    const lines = Array.from(fixed.querySelectorAll('line'));
    lines.forEach((ln, i) => {
      const info = updateSVGPreviewTab4.__base.lineData[i];
      const corner = info.cornerName === 'TL' ? TL : info.cornerName === 'TR' ? TR : info.cornerName === 'BL' ? BL : BR;
      const xCorner = corner.x, yCorner = corner.y;
      const xOther = xCorner + info.vx;
      const yOther = yCorner + info.vy;

      if (info.cornerAtP1) {
        ln.setAttribute('x1', xCorner); ln.setAttribute('y1', yCorner);
        ln.setAttribute('x2', xOther);  ln.setAttribute('y2', yOther);
      } else {
        ln.setAttribute('x2', xCorner); ln.setAttribute('y2', yCorner);
        ln.setAttribute('x1', xOther);  ln.setAttribute('y1', yOther);
      }
    });

    drawMeasurements();
  }

  const targetOuterW = Math.max(50, +dynamicWidth  || updateSVGPreviewTab4.__base.outer.w);
  const targetOuterH = Math.max(50, +dynamicHeight || updateSVGPreviewTab4.__base.outer.h);
  applyResizeByOuter(targetOuterW, targetOuterH);

}

// ===== OPENING MOD + HANDLE TOGGLE =====
function updateOpeningSvgInFourthTab(svg_check, label) {
  let svgElement;
  if (typeof svg_check === 'string') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg_check, "image/svg+xml");
    svgElement = doc.documentElement;
  } else if (svg_check instanceof SVGSVGElement) {
    svgElement = svg_check;
  } else {
    toggleBaseHandles(document.querySelector('#svg_main'), 'none');
    return;
  }

  const svg = document.querySelector('#svg_main');
  if (!svg) return;

  const customGroup = svg.querySelector('#polylineGroup');
  if (!customGroup) { toggleBaseHandles(svg, 'none'); return; }

  const comboMap = {
    'Dreh-Kipp Links': ['Dreh Links', 'Kipp Griff Oben'],
    'Dreh-Kipp Rechts': ['Dreh Rechts', 'Kipp Griff Oben']
  };

  const labelsToShow = comboMap[label] || [label];

  const openingGroups = customGroup.querySelectorAll('[data-label]');
  openingGroups.forEach(g => {
    const dataLabel = g.getAttribute('data-label');
    g.style.display = labelsToShow.includes(dataLabel) ? 'block' : 'none';
  });

  const handleElement = svgElement.querySelector('[id*="handle"], [class*="handle"]');
  if (!handleElement) { toggleBaseHandles(svg, 'none'); return; }

  const transform = handleElement.getAttribute('transform') || '';
  const translateMatch = transform.match(/translate\(\s*([0-9.\-]+)[ ,]+([0-9.\-]+)\s*\)/);
  if (!translateMatch) { toggleBaseHandles(svg, 'none'); return; }

  const translateX = parseFloat(translateMatch[1]);
  const THRESHOLD_X = 500;
  const DEAD_ZONE = 10;

  if (translateX < THRESHOLD_X - DEAD_ZONE) toggleBaseHandles(svg, 'left');
  else if (translateX > THRESHOLD_X + DEAD_ZONE) toggleBaseHandles(svg, 'right');
  else toggleBaseHandles(svg, 'none');
}

function toggleBaseHandles(baseSvg, side) {
  const handleLeft = baseSvg?.querySelector('g#left-handle');
  const handleRight = baseSvg?.querySelector('g#right-handle');
  if (!handleLeft || !handleRight) return;

  side = (side || "").trim().toLowerCase();
  if (side === "left") { handleLeft.style.display = 'block'; handleRight.style.display = 'none'; }
  else if (side === "right") { handleLeft.style.display = 'none'; handleRight.style.display = 'block'; }
  else { handleLeft.style.display = 'none'; handleRight.style.display = 'none'; }
}

function updateDependentTabsFromTab4() {
  const tab4Svg = document.querySelector('#tab4 #svgPreviewBox');
  if (!tab4Svg) return;
  const tab5SvgContainer = document.querySelector('#tab5 #svgPreviewBox');
  if (tab5SvgContainer) tab5SvgContainer.innerHTML = tab4Svg.innerHTML;
}



(function () {
  const APP = document.querySelector('.its_my_app_work');
  if (!APP) return;

  const OFFSET_TOP = 80;
  let rafId = null;

  function updateSidebarPosition() {
    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {

      const scrollY = window.scrollY;

      const appRect = APP.getBoundingClientRect();

      // 🔥 SECTION GATE: start logic when section hits viewport
      const sectionReached = appRect.top <= OFFSET_TOP &&
                             appRect.bottom >= OFFSET_TOP;

      const activeTab =
        APP.querySelector('.tab-content.active') ||
        APP.querySelector('.tab-content');

      if (!activeTab) return;

      const sidebar = activeTab.querySelector('.preview-box');
      if (!sidebar) return;

      // If section NOT reached → remove all classes
      if (!sectionReached) {
        sidebar.classList.remove(
          'sidebar--top',
          'sidebar--fixed',
          'sidebar--bottom'
        );
        return;
      }

      // From here onward, section is active
      const appTop = scrollY + appRect.top;
      const appBottom = appTop + APP.offsetHeight;

      const sidebarHeight = sidebar.offsetHeight;
      const sidebarBottomLimit =
        appBottom - sidebarHeight - OFFSET_TOP;

      sidebar.classList.remove(
        'sidebar--top',
        'sidebar--fixed',
        'sidebar--bottom'
      );

     if (scrollY > sidebarBottomLimit) {
        sidebar.classList.add('sidebar--bottom');

      } else {
        sidebar.classList.add('sidebar--fixed');
      }

    });
  }

  window.addEventListener('scroll', updateSidebarPosition);
  window.addEventListener('resize', updateSidebarPosition);

  window.updateSidebarPosition = updateSidebarPosition;

  updateSidebarPosition();
})();

function moveActiveTabBottomCheckpoint() {
  const slot = document.getElementById('globalBottomCheckpoint');
  if (!slot) return;

  // restore previous
  const prevTab = document.querySelector('.tab-content.bottom-detached');
  if (prevTab) {
    prevTab.classList.remove('bottom-detached');
    const oldBottom = slot.querySelector('.bottom_check_point');
    if (oldBottom) prevTab.append(oldBottom);
    delete slot.dataset.activeTab;
  }

  // move active
  const activeTab = document.querySelector('.tab-content.active');
  if (!activeTab) {
    delete slot.dataset.activeTab;
    return;
  }

  const bottom = activeTab.querySelector('.bottom_check_point');
  if (!bottom) {
    slot.dataset.activeTab = activeTab.id || '';
    return;
  }

  activeTab.classList.add('bottom-detached');
  slot.dataset.activeTab = activeTab.id || '';
  slot.append(bottom);
}



function canAccessTab(idx) {
  return idx <= maxUnlockedTab;
}

function switchTab(idx) {

	if (idx === 5) {
  hasVisitedTab5 = true;
}

	  // 🔥 BLOCK WRONG JUMP
  if (!canAccessTab(idx)) {
    alert("Complete previous steps first");
    return;
  }

  const tabs = document.querySelectorAll('.tab-link');
  const contents = document.querySelectorAll('.tab-content');

  // 🚫 block if not allowed
  if (idx > maxUnlockedTab) return;

  if (!tabs[idx] || !contents[idx]) return;

  moveTabContentBelowHeader(idx);

  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));

  tabs[idx].classList.add('active');
  contents[idx].classList.add('active');

  currentTab = idx;
  updateProgressBar();

  // 🔹 YOUR ORIGINAL LOGIC (UNCHANGED)
  if (idx === 1) renderTab2WingOptions();
  if (idx === 2) renderTab3OpeningOptions();

  if (idx === 3) {
    recomputeTab4Base();
    populateSidebar();
    refreshGroesseAfterChange();
  }

  if (idx === 4) {
    renderTab5Options();
    updateTab5Sidebar();
  }

  if (idx === 5) {
    renderTab6Options();
    updateTab6Sidebar();
  }

  if (idx === 6) {
    updateTab7Summary();
  }

  // ✅ UNLOCK NEXT TAB STEP BY STEP
  if (idx >= maxUnlockedTab) {
    maxUnlockedTab = idx + 1;
  }

  updateTabEnableStatus();

  updateSidebarPosition();
  moveActiveTabBottomCheckpoint();
  scrollToTabTop();
}


// Reset mullion inputs whenever user goes back to Tab 2
document.addEventListener('click', function(e) {
  // match Tab 2 link (adapt selector if different)
  if (e.target.closest('.tab-link') && e.target.textContent.trim().toLowerCase() === 'flügel') {
    const box = document.getElementById('elemets_group');
    if (box) {
      box.querySelectorAll('.sec, .note').forEach(n => n.remove());
      box.style.display = 'none';
    }
    // reset cached model so Tab 4 recomputes
    if (typeof updateSelectedBaseSVG === 'function') {
      updateSelectedBaseSVG.__base = null;
    }
  }
});


function switchSubTab(subtabId, subtabBtns) {
  subtabBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-id') == subtabId));
  document.getElementById('groesse-tab').style.display =
    subtabBtns[0].getAttribute('data-id') == subtabId ? 'block' : 'none';
  document.getElementById('beschlag-tab').style.display =
    subtabBtns[1].getAttribute('data-id') == subtabId ? 'block' : 'none';

  if (document.getElementById('beschlag-tab').style.display === 'block') {
    const grid = document.querySelector('#beschlag-tab .option-grid');
    if (grid) {
      const active = grid.querySelector('.card-option.active');
      if (!active) {
        const first = grid.querySelector('.card-option');
        if (first) first.click();
      }
    }
  }
}

function restorePreviews() {
  document.querySelectorAll('.preview-box').forEach(box => {
    const name = box.dataset.preview;
    const img = box.querySelector('img');
    const txt = box.querySelector('p');
    if (name === 'wing') {
      const svgBox = box.querySelector('.wing-svg-preview');
      if (svgBox) svgBox.innerHTML = windowConfig.wingSvg || '';
      if (img) img.style.display = 'none';
      if (txt) txt.innerHTML = `${windowConfig.profile || ''}<br>${windowConfig.wing || ''}`;
    } else if (name === 'opening') {
      const svgBox = box.querySelector('.opening-svg-preview');
      if (svgBox) svgBox.innerHTML = windowConfig.openingSvg || '';
      if (img) img.style.display = 'none';
      if (txt) txt.innerHTML = `${windowConfig.profile || ''}<br>${windowConfig.wing || ''}<br>${windowConfig.opening || ''}`;
    } else if (name === 'beschlag') {
      const svgBox = box.querySelector('.opening-svg-preview');
      if (svgBox) {
        const beschlagTab = document.querySelector('#beschlag-tab .option-grid .card-option.active .opening-svg-container');
        svgBox.innerHTML = beschlagTab ? beschlagTab.innerHTML : '';
      }
      if (img) img.style.display = 'none';
      if (txt) txt.innerHTML = beschlagLabel;
    } else {
      if (!img || !txt) return;
      img.src = '';
      txt.innerHTML = '';
      if (name === 'profile' && windowConfig.profile) {
        txt.innerHTML = `${windowConfig.profile}`;
        img.src = windowConfig.profileImg;
      }
    }
  });
}

function restoreActiveSelections() {
  document.querySelectorAll('#tab1 .card-option').forEach(el =>
    el.classList.toggle('active', el.querySelector('strong').innerText.replace(/^DRUTEX /,'') === windowConfig.profile)
  );
  document.querySelectorAll('#tab2 .card-option').forEach(el => {
    const isActive = el.dataset.id === String(windowConfig.wingId);
    el.classList.toggle('active', isActive);
    if (isActive) {
      updateWingSidebarSVG(windowConfig.wingSvg);
      updateWingSidebarPrice(windowConfig.wingPrice);
    }
  });
  document.querySelectorAll('#tab3 .card-option').forEach(el =>
    el.classList.toggle('active', el.dataset.id === String(windowConfig.openingId))
  );
  document.querySelectorAll('#beschlag-tab .card-option').forEach(el => {
    const isActive = el.classList.contains('active');
    el.classList.toggle('active', isActive);
  });
}

function updateProgressBar() {
  const totalTabs = 7;
  const pct = ((currentTab + 1) / totalTabs) * 100;
  document.querySelectorAll('.progress-bar').forEach(bar => bar.style.width = pct + '%');
}

function populateSidebar() {
  ['width','height','profile','wing','opening'].forEach(field => {
    const sb = document.getElementById(`sb-${field}`);
    const val = (field === 'profile' || field === 'wing' || field === 'opening')
      ? windowConfig[field]
      : (document.getElementById(field) ? document.getElementById(field).value : '');
    if (sb && val !== undefined) sb.textContent = val;
  });
  const beschlag = document.querySelector('#beschlag-tab .card-option.active');
  if (beschlag) {
    document.getElementById('sb-beschlag').textContent = beschlag.innerText.trim();
    beschlagLabel = beschlag.innerText.trim();
  }


}

function updateWingSidebarSVG(svg) {
  document.querySelectorAll('.preview-box[data-preview="wing"] .wing-svg-preview').forEach(box => {
    box.innerHTML = svg ? svg : '';
  });
}
function updateWingSidebarPrice(price) {
  const box = document.querySelector('#sidebar-wing-price');
  if (box) {
    const hasPrice = price !== null && price !== undefined && price !== '';
    setSidebarPrice(box, hasPrice ? price : null, '');
  }
}
function updateOpeningSidebarSVG(svg) {
  document.querySelectorAll('.preview-box[data-preview="opening"] .opening-svg-preview').forEach(box => {
    box.innerHTML = svg ? svg : '';
  });
}







document.addEventListener('click', function(e) {
  if (e.target.closest('#tab1 .card-option') || e.target.closest('.tab-nav-buttons button')) {
    setTimeout(() => { renderTab2WingOptions(); restoreActiveSelections(); }, 20);
  }
});

function initConfigurator() {
  ['#tab1 .card-option'].forEach(sel => {
    const first = document.querySelector(sel);
    if (first) {
      first.classList.add('active');
      const label = first.querySelector('strong')?.innerText.replace(/^DRUTEX /, '') || first.dataset.label;
      windowConfig.profile = label;
      windowConfig.profileImg = first.querySelector('img')?.src || null;
    }
  });

  windowConfig.wing = null; windowConfig.wingId = null; windowConfig.wingSvg = null;
  windowConfig.opening = null; windowConfig.openingId = null; windowConfig.openingSvg = null;

  restorePreviews();
  restoreActiveSelections();
  updateAllSidebars();
   // ✅ After initializing profile, immediately render and auto-select Wing
  renderTab2WingOptions();
 // 🔥 default open first accordion tab
setTimeout(() => {
  switchTab(0);
}, 0);

}

setTimeout(() => {
	restorePreviews();
	updateGroesseDropdownsAndSidebar(); }, 100);

/* ===========================================================
   SELECTED SVG RESIZER (outer_frame_* as OUTER, vent_2_* as INNER)
   - Keeps existing viewBox (no cropping)
   - Scales a wrapper group around visual content anchored at OUTER top-left
   - Draws measurements inside the current viewBox
   =========================================================== */

// mapping for selected SVGs (you can extend/override if a vendor uses other ids)
function getSelectedIdMapping() {
  return {
    outerIds: ['outer_frame_1','outer_frame_2','outer_frame_3','outer_frame_4'],
    innerIds: ['vent_2_1','vent_2_2','vent_2_3','vent_2_4'],
    // best effort bottom ids (optional)
    bottomIds: ['bottom','sill','threshold']
  };
}

// wrap drawable nodes (except <defs> and measurement groups) into a scale group
function ensureSelectedScaleGroup(svg) {
  let group = svg.querySelector('#__selectedScaleGroup');
  if (group) return group;

  group = document.createElementNS('http://www.w3.org/2000/svg','g');
  group.setAttribute('id','__selectedScaleGroup');

  const toMove = [];
  svg.childNodes.forEach(n => {
    if (n.nodeType !== 1) return; // element only
    const tag = n.tagName && n.tagName.toLowerCase();
    if (tag === 'defs') return;
    if (n.id && (n.id === 'measurements' || n.id === 'measurements_selected')) return;
    toMove.push(n);
  });
  toMove.forEach(n => group.appendChild(n));
  svg.insertBefore(group, svg.firstChild); // keep defs above
  return group;
}

function unionBBox(elements) {
  let box = null;
  elements.forEach(el => {
    try {
      const b = el.getBBox();
      if (!b || (!b.width && !b.height)) return;
	        if (!box) box = { x:b.x, y:b.y, x2:b.x+b.width, y2:b.y+b.height };
      else {
        box.x  = Math.min(box.x, b.x);
        box.y  = Math.min(box.y, b.y);
        box.x2 = Math.max(box.x2, b.x + b.width);
        box.y2 = Math.max(box.y2, b.y + b.height);
      }
    } catch(_) {}
  });
  if (!box) return null;
  return { x: box.x, y: box.y, width: box.x2 - box.x, height: box.y2 - box.y };
}

function drawSelectedBottomRect(svg, liveOuter, opts = {}) {
  // Constant visual gap/height in VB units (doesn't scale with artwork)
  const GAP = opts.gap != null ? opts.gap : 30;      // distance below OUTER
  const H   = opts.height != null ? opts.height : 18; // rect height

  // Remove previous bottom rect (if any)
  const prev = svg.querySelector('#bottom_selected');
  if (prev) prev.remove();

  if (!liveOuter || !isFinite(liveOuter.x) || !isFinite(liveOuter.y)) return;

  const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  r.setAttribute('id', 'bottom_selected');
  r.setAttribute('x', liveOuter.x);
  r.setAttribute('y', liveOuter.y + liveOuter.height + GAP);
  r.setAttribute('width', Math.max(1, liveOuter.width));
  r.setAttribute('height', H);
  r.setAttribute('fill', '#D9D9D9');
  r.setAttribute('stroke', '#999');
  r.setAttribute('stroke-width', '1');

  // Append outside the scaling group so gap/height remain constant
  svg.appendChild(r);
}



function initDynamicInputs() {
  const svg = document.querySelector("#tab6 #svgPreviewBox svg");
  if (!svg) return;

  // Prepare the input container
  let controlsContainer = document.querySelector("#formobilegroup");
  if (!controlsContainer) {
    controlsContainer = document.createElement("div");
    controlsContainer.id = "formobilegroup";
    document.querySelector("#tab6").appendChild(controlsContainer);
  } else {
    controlsContainer.innerHTML = "";
  }

  // Ensure <defs> exists for clip paths
  let defs = svg.querySelector("defs#lineClipDefs");
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.setAttribute("id", "lineClipDefs");
    svg.insertBefore(defs, svg.firstChild);
  }

  const infills = svg.querySelectorAll("path[id^='infill_']");
  infills.forEach((infill, idx) => {
    const infillId = infill.id;
    const num = idx + 1;

    if (!document.getElementById("clip_" + infillId)) {
      const clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clip.setAttribute("id", "clip_" + infillId);
      const clone = infill.cloneNode(true);
      clone.removeAttribute("id");
      clip.appendChild(clone);
      defs.appendChild(clip);
    }

    const hGroup = document.createElement("div");
    hGroup.classList.add("form-group");
    const hLabel = document.createElement("label");
    hLabel.textContent = `HORIZONTAL (ELEMENTE ${num})`;
    const hInput = document.createElement("input");
    hInput.type = "number";
    hInput.min = 0;
    hInput.max = 300;
    hInput.value = 0;
    hInput.dataset.target = infillId;
    hInput.dataset.type = "horizontal";
    hGroup.appendChild(hLabel);
    hGroup.appendChild(hInput);

    const vGroup = document.createElement("div");
    vGroup.classList.add("form-group");
    const vLabel = document.createElement("label");
    vLabel.textContent = `SENKRECHT (ELEMENTE ${num})`;
    const vInput = document.createElement("input");
    vInput.type = "number";
    vInput.min = 0;
    vInput.max = 300;
    vInput.value = 0;
    vInput.dataset.target = infillId;
    vInput.dataset.type = "vertical";
    vGroup.appendChild(vLabel);
    vGroup.appendChild(vInput);

   const wrapper = document.createElement("div");
wrapper.classList.add("element-group", `element${num}`);
wrapper.appendChild(hGroup);
wrapper.appendChild(vGroup);
controlsContainer.appendChild(wrapper);

    hInput.addEventListener("input", () => drawLines(infillId));
    vInput.addEventListener("input", () => drawLines(infillId));
  });
}

function drawLines(infillId) {
  const svg = document.querySelector("#tab6 #svgPreviewBox svg");
  const infill = svg.querySelector(`#${infillId}`);
  if (!infill) return;

  // CLEANUP: remove old bars
  svg.querySelectorAll(`g[data-owner='${infillId}']`).forEach(el => el.remove());

  // ✅ 1. BBox = real infill size
  const bbox = infill.getBBox();

  // ✅ 2. ViewBox and Rendered Dimensions
  const viewBox = svg.viewBox.baseVal;
  const renderedWidth = svg.clientWidth;
  const renderedHeight = svg.clientHeight;

  // Optional scale (not used unless needed for screen pixel positioning)
  const scaleX = renderedWidth / viewBox.width;
  const scaleY = renderedHeight / viewBox.height;

  // DEBUG INFO — useful for dev
  console.table({
    "infillId": infillId,
    "bbox.x": bbox.x,
    "bbox.y": bbox.y,
    "bbox.width": bbox.width,
    "bbox.height": bbox.height,
    "viewBox.x": viewBox.x,
    "viewBox.y": viewBox.y,
    "viewBox.width": viewBox.width,
    "viewBox.height": viewBox.height,
    "renderedWidth (px)": renderedWidth,
    "renderedHeight (px)": renderedHeight,
    "scaleX": scaleX.toFixed(2),
    "scaleY": scaleY.toFixed(2)
  });

  const vInput = document.querySelector(`input[data-target='${infillId}'][data-type='vertical']`);
  const hInput = document.querySelector(`input[data-target='${infillId}'][data-type='horizontal']`);
  const vCount = parseInt(vInput?.value || 0);
  const hCount = parseInt(hInput?.value || 0);
  const barWidth = 20;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.dataset.owner = infillId;
  group.setAttribute("clip-path", `url(#clip_${infillId})`);

const color_line = windowConfig.farbeInnenfill;

  // Vertical bars
  if (vCount > 0) {
    const step = bbox.width / (vCount + 1);
    for (let i = 1; i <= vCount; i++) {
      const x = bbox.x + step * i - barWidth / 2;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", bbox.y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", bbox.height);
      rect.setAttribute("fill", color_line);
      rect.setAttribute("stroke", "none");
      rect.setAttribute("stroke-width", 2);
      group.appendChild(rect);
    }
  }

  // Horizontal bars
  if (hCount > 0) {
    const step = bbox.height / (hCount + 1);
    for (let i = 1; i <= hCount; i++) {
      const y = bbox.y + step * i - barWidth / 2;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", bbox.x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", bbox.width);
      rect.setAttribute("height", barWidth);
      rect.setAttribute("fill", color_line);
      rect.setAttribute("stroke", "none");
      rect.setAttribute("stroke-width", 2);
      group.appendChild(rect);
    }
  }

const scaleGroup = svg.querySelector("#__selectedScaleGroup");
(scaleGroup || svg).appendChild(group);
}

function waitForTab6SvgAndInit() {
  const svgBox = document.querySelector("#tab6 #svgPreviewBox");
  if (!svgBox) return;

  const observer = new MutationObserver((mutations, obs) => {
    const svg = svgBox.querySelector("svg");
    if (svg) {
      initDynamicInputs(); // when the SVG is ready
      obs.disconnect();
    }
  });

  observer.observe(svgBox, { childList: true, subtree: true });
}



function updateSelectedBaseSVG(dynamicWidth, dynamicHeight) {
  const svg = document.querySelector('#tab4 #svgPreviewBox svg');
  if (!svg) return;
  if ((svg.dataset.source || '').toLowerCase() !== 'selected') return;

  const num = (v, d=0) => (Number.isFinite(+v) ? +v : d);

  // ---- one-time base capture (no handle reparenting) ----
  if (!updateSelectedBaseSVG.__base || updateSelectedBaseSVG.__base.svg !== svg) {
    // ensure viewBox exists
    if (!svg.getAttribute('viewBox')) {
      try {
        const b = svg.getBBox();
        svg.setAttribute('viewBox', `${num(b.x,0)} ${num(b.y,0)} ${Math.max(1,num(b.width,160))} ${Math.max(1,num(b.height,160))}`);
      } catch {
        const w = Math.max(1, num(svg.getAttribute('width'), 160));
        const h = Math.max(1, num(svg.getAttribute('height'), 160));
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
    }

    // create scale group if needed, but DO NOT move handles into it
    let scaleGroup = svg.querySelector('#__selectedScaleGroup');
    if (!scaleGroup) {
      scaleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      scaleGroup.setAttribute('id','__selectedScaleGroup');

      const toMove = [];
      svg.childNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        const id  = (n.id || '').toLowerCase();
        const cls = (n.getAttribute && (n.getAttribute('class') || '').toLowerCase()) || '';

        if (tag === 'defs') return;
        if (id === 'measurements' || id === 'measurements_selected' || id === 'bottom_selected') return;

        // leave any "handle" elements exactly where they are (outside the scale group)
        const isHandle = /handle/.test(id) || /handle/.test(cls);
        if (isHandle) return;

        toMove.push(n);
      });
      toMove.forEach(n => scaleGroup.appendChild(n));
      svg.insertBefore(scaleGroup, svg.firstChild);
    }

    // locate OUTER bbox (prefer outer_frame_*; fallback to vb)
    const outerIds = ['outer_frame_1','outer_frame_2','outer_frame_3','outer_frame_4'];
    const outers = outerIds.map(id => svg.querySelector(`#${CSS.escape(id)}`)).filter(Boolean);
    const unionBBox = (els) => {
      let box=null;
      els.forEach(el => {
        try {
          const b = el.getBBox();
          if (!b || (!b.width && !b.height)) return;
          if (!box) box = {x:b.x,y:b.y,x2:b.x+b.width,y2:b.y+b.height};
          else {
            box.x  = Math.min(box.x, b.x);
            box.y  = Math.min(box.y, b.y);
            box.x2 = Math.max(box.x2, b.x + b.width);
            box.y2 = Math.max(box.y2, b.y + b.height);
          }
        } catch {}
      });
      return box ? { x:box.x, y:box.y, width:box.x2-box.x, height:box.y2-box.y } : null;
    };

    const vb = (svg.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number);
    const vbX=num(vb[0],0), vbY=num(vb[1],0), vbW=Math.max(1,num(vb[2],160)), vbH=Math.max(1,num(vb[3],160));
    const ob = unionBBox(outers) || { x:vbX, y:vbY, width:vbW, height:vbH };

    // cache all handle-like elements (stay where they are)
    const handleEls = Array.from(svg.querySelectorAll('[id*="handle" i], [class*="handle" i]'));
    // store their original transforms once
    handleEls.forEach(el => {
      if (!el.__origTransform) el.__origTransform = el.getAttribute('transform') || '';
    });

    // cache base
    updateSelectedBaseSVG.__base = {
      svg,
      scaleGroup,
      groupBaseTransform: scaleGroup.getAttribute('transform') || '',
      outer: { x:num(ob.x,0), y:num(ob.y,0), w:Math.max(1,num(ob.width,160)), h:Math.max(1,num(ob.height,160)) },
      handles: handleEls
    };

    // clean old overlays
    const oldM = svg.querySelector('#measurements_selected'); if (oldM) oldM.remove();
    const oldB = svg.querySelector('#bottom_selected');       if (oldB) oldB.remove();
  }

  const B = updateSelectedBaseSVG.__base;

  // ---- compute target and scale only the scale-group content ----
  const newW = Math.max(1, Math.round(num(dynamicWidth,  B.outer.w)));
  const newH = Math.max(1, Math.round(num(dynamicHeight, B.outer.h)));
  const sx = newW / B.outer.w;
  const sy = newH / B.outer.h;
  const ox = B.outer.x, oy = B.outer.y;

  const baseX = (B.groupBaseTransform || '').trim();
  const prefix = baseX ? baseX + ' ' : '';
  B.scaleGroup.setAttribute(
    'transform',
    `${prefix}translate(${ox},${oy}) scale(${sx},${sy}) translate(${-ox},${-oy})`
  );

  // viewport reflects requested size
  svg.setAttribute('width',  String(newW));
  svg.setAttribute('height', String(newH));
  svg.setAttribute('viewBox', `0 0 ${newW} ${newH}`);

  // ---- keep handles EXACTLY as authored (size + position) ----
  B.handles.forEach(el => {
    el.setAttribute('transform', el.__origTransform || '');
  });

  // measurements/bottom overlay in VB space (unchanged logic)
  drawSelectedMeasurements(svg, newW, newH);
}


function drawSelectedBottomRect(svg, liveOuter, opts = {}) {
  // visual size in viewBox units
  const H     = opts.height != null ? +opts.height : 22; // rect height
  const MARGIN = opts.margin != null ? +opts.margin : 0; // gap from very bottom

  // remove previous
  const prev = svg.querySelector('#bottom_selected');
  if (prev) prev.remove();

  // read current viewBox (authoritative coordinate space)
  const vbStr = svg.getAttribute('viewBox') || '';
  const parts = vbStr.trim().split(/[ ,]+/).map(Number);
  const vbX = Number.isFinite(parts[0]) ? parts[0] : 0;
  const vbY = Number.isFinite(parts[1]) ? parts[1] : 0;
  const vbW = Math.max(1, Number.isFinite(parts[2]) ? parts[2] : (+svg.getAttribute('width') || 160));
  const vbH = Math.max(1, Number.isFinite(parts[3]) ? parts[3] : (+svg.getAttribute('height') || 160));

  // lock to preview bottom (full width). No dependence on liveOuter.
  const x = vbX;
  const width = vbW;
  const y = vbH; // <<-- key line: hug the bottom of the viewBox

  const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  r.setAttribute('id', 'bottom_selected');
  r.setAttribute('x', x);
  r.setAttribute('y', y);
  r.setAttribute('width', width);
  r.setAttribute('height', H);
  r.setAttribute('fill', '#fff');
  r.setAttribute('stroke', '#999');
  r.setAttribute('stroke-width', '1');
  r.setAttribute('pointer-events', 'none');

  svg.appendChild(r);
}







function drawSelectedMeasurements(svg, a, b, c, d, outW, outH) {
  const num = (v, def = 0) => { const n = +v; return Number.isFinite(n) ? n : def; };

  // ----- support both call signatures -----
  let vbX, vbY, vbW, vbH;
  if (arguments.length === 3) {
    vbX = 0; vbY = 0; vbW = Math.max(1, num(a, 160)); vbH = Math.max(1, num(b, 160));
    outW = vbW; outH = vbH;
  } else {
    vbX = num(a, 0); vbY = num(b, 0);
    vbW = Math.max(1, num(c, 160)); vbH = Math.max(1, num(d, 160));
    outW = Math.max(1, num(outW, vbW)); outH = Math.max(1, num(outH, vbH));
  }

  // ----- cleanup old overlays -----
  ['#measurements_selected', '#bottom_selected', '#sub_measurements_selected']
    .forEach(sel => { const n = svg.querySelector(sel); if (n) n.remove(); });

  // ----- helpers -----
  const ids = getSelectedIdMapping?.() || { outerIds: ['outer_frame_1','outer_frame_2','outer_frame_3','outer_frame_4'] };
  const unionBBoxSafe = (els) => {
    let box = null;
    els.forEach(el => {
      try {
        const b = el.getBBox();
        if (!b || (!b.width && !b.height)) return;
        if (!box) box = {x:b.x, y:b.y, x2:b.x+b.width, y2:b.y+b.height};
        else { box.x=Math.min(box.x,b.x); box.y=Math.min(box.y,b.y); box.x2=Math.max(box.x2,b.x+b.width); box.y2=Math.max(box.y2,b.y+b.height); }
      } catch {}
    });
    return box ? { x:box.x, y:box.y, width:box.x2-box.x, height:box.y2-box.y } : null;
  };

  const outerEls = (ids.outerIds || []).map(id => svg.querySelector(`#${CSS.escape(id)}`)).filter(Boolean);
  let liveOuter = unionBBoxSafe(outerEls) || { x: vbX, y: vbY, width: vbW, height: vbH };
  liveOuter = {
    x: num(liveOuter.x, vbX),
    y: num(liveOuter.y, vbY),
    width:  Math.max(1, num(liveOuter.width,  vbW)),
    height: Math.max(1, num(liveOuter.height, vbH))
  };

  // bottom band (unchanged)
  drawSelectedBottomRect(svg, liveOuter);

  // ----- main totals (UNCHANGED behaviour) -----
  const leftX  = Math.max(vbX + 1, liveOuter.x);
  ///const rightX = Math.min(vbX + vbW - 1, liveOuter.x + liveOuter.width);
  ///const botY   = Math.min(vbY + vbH - 1, liveOuter.y + liveOuter.height);

  const rightX = Math.min(vbW);
  const botY   = Math.min(vbH);

  const topY   = vbY + 1;
  const midY   = vbY + vbH / 2;
  const midX   = vbX + vbW / 2;

  // 🔥 scale factor based on current outer size
  const scaleFactor = Math.max(outW, outH) / 600;   // 500 = baseline, adjust for taste
  const fontSize    = 20 * scaleFactor;             // base 30px → scale up/down
  const bgW         = 20 * scaleFactor;             // base 72 rect width
  const bgH         = 28 * scaleFactor;             // base 36 rect height

  const textStyle = `fill:black; font-size:${fontSize}px; font-family:Arial; dominant-baseline:middle; text-anchor:middle;`;

  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('id','measurements_selected');

  // left (height)
  const L = document.createElementNS('http://www.w3.org/2000/svg','line');
  L.setAttribute('x1', leftX - 60); L.setAttribute('x2', leftX - 60);
  L.setAttribute('y1', topY);       L.setAttribute('y2', vbY + vbH - 1);
  L.setAttribute('stroke', '#000'); g.appendChild(L);

  const leftBG = document.createElementNS('http://www.w3.org/2000/svg','rect');
  leftBG.setAttribute('x', midX - bgW/2 - (midX - (leftX - 60)));
  leftBG.setAttribute('y', midY - bgH/2);
  leftBG.setAttribute('width', bgW);
  leftBG.setAttribute('height', bgH);
  leftBG.setAttribute('fill', '#F4F4F4'); g.appendChild(leftBG);

  const Lt = document.createElementNS('http://www.w3.org/2000/svg','text');
  Lt.setAttribute('x', leftX - 60);
  Lt.setAttribute('y', midY);
  Lt.setAttribute('style', textStyle);
  Lt.textContent = Math.round(outH); g.appendChild(Lt);

  // right (height + 30)
  const RIGHT_MAIN_X = rightX + 60;
  const R = document.createElementNS('http://www.w3.org/2000/svg','line');
  R.setAttribute('x1', RIGHT_MAIN_X); R.setAttribute('x2', RIGHT_MAIN_X);
  R.setAttribute('y1', topY);         R.setAttribute('y2', vbY + vbH + 15);
  R.setAttribute('stroke', '#000'); g.appendChild(R);

  const rightBG = document.createElementNS('http://www.w3.org/2000/svg','rect');
  rightBG.setAttribute('x', RIGHT_MAIN_X - bgW/2);
  rightBG.setAttribute('y', midY - bgH/2);
  rightBG.setAttribute('width', bgW);
  rightBG.setAttribute('height', bgH);
  rightBG.setAttribute('fill', '#F4F4F4'); g.appendChild(rightBG);

  const Rt = document.createElementNS('http://www.w3.org/2000/svg','text');
  Rt.setAttribute('x', RIGHT_MAIN_X);
  Rt.setAttribute('y', midY);
  Rt.setAttribute('style', textStyle);
  Rt.textContent = Math.round(outH + 40); g.appendChild(Rt);

  // bottom (width)
  const BOTTOM_MAIN_Y = botY + 70;
  const Bline = document.createElementNS('http://www.w3.org/2000/svg','line');
  Bline.setAttribute('x1', vbX + 1);           Bline.setAttribute('x2', vbX + vbW - 1);
  Bline.setAttribute('y1', BOTTOM_MAIN_Y);     Bline.setAttribute('y2', BOTTOM_MAIN_Y);
  Bline.setAttribute('stroke', '#000'); g.appendChild(Bline);

  const bottomBG = document.createElementNS('http://www.w3.org/2000/svg','rect');
  bottomBG.setAttribute('x', midX - bgW/2 - 10);
  bottomBG.setAttribute('y', BOTTOM_MAIN_Y - bgH/2 + 5);
  bottomBG.setAttribute('width', bgW + 20);
  bottomBG.setAttribute('height', bgH);
  bottomBG.setAttribute('fill', '#F4F4F4'); g.appendChild(bottomBG);

  const Bt = document.createElementNS('http://www.w3.org/2000/svg','text');
  Bt.setAttribute('x', midX);
  Bt.setAttribute('y', BOTTOM_MAIN_Y + 5);
  Bt.setAttribute('style', textStyle);
  Bt.textContent = Math.round(outW); g.appendChild(Bt);

  svg.appendChild(g);

  // ----- dynamic sub-measurements (proportional, stacked lanes) -----
  const sg = document.createElementNS('http://www.w3.org/2000/svg','g');
  sg.setAttribute('id','sub_measurements_selected');

  // lanes (kept clear of totals)
  const RIGHT_SPLIT_X  = rightX + 110;       // vertical lane (heights)
  const BOTTOM_SPLIT_Y = BOTTOM_MAIN_Y + 60; // horizontal lane (widths)

  const addLabelRect = (x, y) => {
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x', x - bgW/2);
    r.setAttribute('y', y - bgH/2);
    r.setAttribute('width', bgW + 20);
    r.setAttribute('height', bgH);
    r.setAttribute('fill', '#F4F4F4');
    return r;
  };

  // collect mullions dynamically
  const mullions = Array.from(svg.querySelectorAll('[id^="mullion_"]'));
  const vCuts = []; // x (vertical mullions)
  const hCuts = []; // y (horizontal mullions)
  const withinOuter = (b) =>
    b.x + b.width  > liveOuter.x &&
    b.x            < liveOuter.x + liveOuter.width &&
    b.y + b.height > liveOuter.y &&
    b.y            < liveOuter.y + liveOuter.height;

  mullions.forEach(el => {
    try {
      const b = el.getBBox(); if (!withinOuter(b)) return;
      if (b.height >= b.width * 3) { // vertical
        const x = b.x + b.width/2;
        if (x > liveOuter.x && x < liveOuter.x + liveOuter.width) vCuts.push(x);
      } else if (b.width >= b.height * 3) { // horizontal
        const y = b.y + b.height/2;
        if (y > liveOuter.y && y < liveOuter.y + liveOuter.height) hCuts.push(y);
      }
    } catch {}
  });

  const dedup = (arr, tol) => {
    arr.sort((a,b)=>a-b);
    const out = [];
    for (const v of arr) if (!out.length || Math.abs(v - out[out.length-1]) > tol) out.push(v);
    return out;
  };
  const tolX = Math.max(1, liveOuter.width  * 0.01);
  const tolY = Math.max(1, liveOuter.height * 0.01);
  let vCutsU = dedup(vCuts, tolX);
  let hCutsU = dedup(hCuts, tolY);

  // fallback via infills
  const infills = Array.from(svg.querySelectorAll('[id^="infill_"]'));
  const fromInfills = (axis) => {
    if (!infills.length) return [];
    // how many groups along this axis?
    const centers = [];
    infills.forEach(el => {
      try { const b = el.getBBox(); centers.push({cx: b.x + b.width/2, cy: b.y + b.height/2}); } catch {}
    });
    const cluster = (vals, tol) => {
      vals.sort((a,b)=>a-b);
      const groups = [];
      for (const v of vals) {
        if (!groups.length || Math.abs(v - groups[groups.length-1].avg) > tol) groups.push({avg:v, n:1});
        else { const g = groups[groups.length-1]; g.avg = (g.avg*g.n + v)/(g.n+1); g.n++; }
      }
      return groups.length;
    };
    if (axis === 'x') {
      const cols = cluster(centers.map(c=>c.cx), tolX);
      if (cols > 1) return Array.from({length: cols-1}, (_,i)=> liveOuter.x + liveOuter.width*(i+1)/cols);
    } else {
      const rows = cluster(centers.map(c=>c.cy), tolY);
      if (rows > 1) return Array.from({length: rows-1}, (_,i)=> liveOuter.y + liveOuter.height*(i+1)/rows);
    }
    return [];
  };
  if (!vCutsU.length) vCutsU = fromInfills('x');
  if (!hCutsU.length) hCutsU = fromInfills('y');

  // segments along each axis
  const toSegments = (bounds, min, max) => {
    const arr = [min, ...bounds.slice().sort((a,b)=>a-b), max];
    const segs = [];
    for (let i=0;i<arr.length-1;i++){
      const a0 = Math.max(min, arr[i]);
      const a1 = Math.min(max, arr[i+1]);
      if (a1 > a0 + 0.5) segs.push([a0, a1]);
    }
    return segs;
  };
  const xSegs = toSegments(vCutsU, liveOuter.x, liveOuter.x + liveOuter.width);   // columns (width)
  const ySegs = toSegments(hCutsU, liveOuter.y, liveOuter.y + liveOuter.height);  // rows (height)

  // ===== proportional, STACKED lanes so line length == value =====

  // Right lane: stack row segments top→bottom
  const usableRightLaneTop = topY;
  const usableRightLaneBot = vbY + vbH - 1; // align to total’s visible span
  const usableRightLaneH   = Math.max(1, usableRightLaneBot - usableRightLaneTop);
  let rightCursorY = usableRightLaneTop;

  if (ySegs.length >= 2) {
    for (const [y1, y2] of ySegs) {
      const segHpx   = Math.max(1, (y2 - y1));                         // actual segment in artwork space
      const ratio    = segHpx / liveOuter.height;                      // share of total height
      const drawH    = Math.max(1, Math.round(ratio * usableRightLaneH)); // how tall we draw in lane
      const x        = RIGHT_SPLIT_X;
      const yStart   = rightCursorY;
      const yEnd     = Math.min(usableRightLaneTop + usableRightLaneH, yStart + drawH);

      const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1', x); ln.setAttribute('x2', x);
      ln.setAttribute('y1', yStart); ln.setAttribute('y2', yEnd);
      ln.setAttribute('stroke', '#000'); sg.appendChild(ln);

      const ym = (yStart + yEnd) / 2;
      sg.appendChild(addLabelRect(x, ym));
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x', x); t.setAttribute('y', ym);
      t.setAttribute('style', textStyle);
      t.textContent = Math.round(outH * ratio); // label already correct before; now line matches it
      sg.appendChild(t);

      rightCursorY = yEnd; // stack next one under this
    }
  }

  // Bottom lane: stack column segments left→right
  const usableBottomLaneLeft = vbX + 1;
  const usableBottomLaneRight= vbX + vbW - 1;
  const usableBottomLaneW    = Math.max(1, usableBottomLaneRight - usableBottomLaneLeft);
  let bottomCursorX = usableBottomLaneLeft;

  if (xSegs.length >= 2) {
    for (const [x1, x2] of xSegs) {
      const segWpx   = Math.max(1, (x2 - x1));
      const ratio    = segWpx / liveOuter.width;
      const drawW    = Math.max(1, Math.round(ratio * usableBottomLaneW));
      const y        = BOTTOM_SPLIT_Y;
      const xStart   = bottomCursorX;
      const xEnd     = Math.min(usableBottomLaneLeft + usableBottomLaneW, xStart + drawW);

      const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1', xStart); ln.setAttribute('x2', xEnd);
      ln.setAttribute('y1', y);      ln.setAttribute('y2', y);
      ln.setAttribute('stroke', '#000'); sg.appendChild(ln);

      const xm = (xStart + xEnd) / 2;
      sg.appendChild(addLabelRect(xm, y));
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x', xm); t.setAttribute('y', y);
      t.setAttribute('style', textStyle);
      t.textContent = Math.round(outW * ratio);
      sg.appendChild(t);

      bottomCursorX = xEnd; // stack next to the right
    }
  }

  svg.appendChild(sg);
}



/* ================================================================
   Axis‑Aware Dynamic Inputs + Inner Resizer (H↔V safe)
   - Detects current SVG axis (stacked top→bottom vs left→right)
   - Rebuilds inputs if axis flips between SVGs
   - Orders panels: top→bottom (H) or left→right (V) deterministically
   - Resizes infill_*, keeps mullion thickness, updates vent_*_*,
     remaps opening_* points to panel‑local UV.
================================================================ */


(function () {
  const GROUP_ID = 'elemets_group';
  const HOST_SEL_PRIMARY  = '#tab4 #svgPreviewBox';
  const HOST_SEL_FALLBACK = '#svg-wrap';

  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const getHost = ()=> $(HOST_SEL_PRIMARY) || $(HOST_SEL_FALLBACK) || document.body;
  const getSVG  = ()=> { const h=getHost(); return h?$('svg',h):null; };

  // --- utils
  const nums = s => (s?.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
  const pathPts = d => { const n=nums(d), o=[]; for(let i=0;i<n.length-1;i+=2)o.push({x:n[i],y:n[i+1]}); return o; };
  const rect = (l,t,r,b)=>({left:l, top:t, right:r, bottom:b, width:r-l, height:b-t, cx:(l+r)/2, cy:(t+b)/2});
  function safeBBox(el){
    try{
      const d = el.getAttribute('d');
      if(d){
        const p = pathPts(d); if(p.length){
          let l=+Infinity,t=+Infinity,r=-Infinity,b=-Infinity;
          for(const {x,y} of p){ if(x<l)l=x; if(x>r)r=x; if(y<t)t=y; if(y>b)b=y; }
          if(isFinite(l+r+t+b)) return rect(l,t,r,b);
        }
      }
    }catch{}
    try{
      const bb = el.getBBox();
      if(bb) return {left:bb.x, top:bb.y, right:bb.x+bb.width, bottom:bb.y+bb.height,
                     width:bb.width, height:bb.height, cx:bb.x+bb.width/2, cy:bb.y+bb.height/2};
    }catch{}
    return null;
  }




function extractHandleAnchor(el, panels) {
  let tx0 = null, ty0 = null, rest = '';

  // parse initial translate
  const tf = el.getAttribute('transform') || '';
  const m = tf.match(/translate\(([^ ,]+)[ ,]([^ ,\)]+)\)(.*)/);
  if (m) {
    tx0 = parseFloat(m[1]);
    ty0 = parseFloat(m[2]);
    rest = m[3] || '';
  }

  // fallback if missing
  if (!Number.isFinite(tx0) || !Number.isFinite(ty0)) {
    const box = el.getBBox();
    tx0 = box.x + box.width / 2;
    ty0 = box.y + box.height / 2;
  }

  // find nearest panel
  let idx = 0, bestD = Infinity;
  for (let i=0;i<panels.length;i++) {
    const b = panels[i].box;
    const cx = clamp(tx0, b.left, b.right);
    const cy = clamp(ty0, b.top,  b.bottom);
    const dx = tx0 - cx, dy = ty0 - cy;
    const d = dx*dx + dy*dy;
    if (d < bestD) { bestD = d; idx = i; }
  }

  // normalize inside that panel
  const b = panels[idx].box;
  const nx = b.width  ? (tx0 - b.left) / b.width  : 0.5;
  const ny = b.height ? (ty0 - b.top)  / b.height : 0.5;

  return { el, panel: idx, nx, ny, rest };
}








  const rectPath = (l,t,r,b)=>`M${r} ${b} L${r} ${t} L${l} ${t} L${l} ${b} Z`;
  //const setD=(el,d)=>{ if(el && d && !/NaN|Infinity|undefined/.test(d)) el.setAttribute('d', d); };

  const setD = (el, d) => {
  if (el && d && !/NaN|Infinity|undefined/.test(d)) {
    // round all numbers to 0.1 to avoid tiny drift
    d = d.replace(/-?\d+(\.\d+)?/g, m =>
      (Math.round(parseFloat(m) * 10) / 10).toString()
    );
    el.setAttribute('d', d);
  }
};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const inside=(p,b)=> p.x>=b.left && p.x<=b.right && p.y>=b.top && p.y<=b.bottom;
  const _hasBad = d => !d || /NaN|Infinity|undefined/.test(d);

  function effectiveScale(svg){
    const ref = svg.querySelector('#__selectedScaleGroup') || svg;
    let m;
    try { m = ref.getCTM(); } catch { m = svg.getScreenCTM?.() || {a:1,b:0,c:0,d:1}; }
    if(!m) m = {a:1,b:0,c:0,d:1};
    return { sx: Math.hypot(m.a,m.b), sy: Math.hypot(m.c,m.d) };
  }
  const modelToUi = (v,axis,sx,sy)=> axis==='y' ? v*sy : v*sx;
  const uiToModel = (v,axis,sx,sy)=> axis==='y' ? v/sy : v/sx;
  const median = a => { if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y), m=Math.floor(s.length/2); return s.length%2 ? s[m] : (s[m-1]+s[m])/2; };

  function clusterCenters(vals, tol){
    if(!vals.length) return [];
    const a=[...vals].sort((x,y)=>x-y);
    const centers=[]; let run=[a[0]];
    for(let i=1;i<a.length;i++){
      if(Math.abs(a[i]-run[run.length-1])<=tol){ run.push(a[i]); }
      else { centers.push(run.reduce((s,v)=>s+v,0)/run.length); run=[a[i]]; }
    }
    centers.push(run.reduce((s,v)=>s+v,0)/run.length);
    return centers;
  }
  const nearestIdx=(v,a)=>{ let k=0,d=Math.abs(v-a[0]); for(let i=1;i<a.length;i++){ const di=Math.abs(v-a[i]); if(di<d){d=di;k=i;} } return k; };
  const nearestVal=(v,a)=> a.length? a[nearestIdx(v,a)] : v;

  function redistributeLock(vals, editedIndex, newVal, TOTAL){
    const out = vals.slice();
    out[editedIndex] = clamp(Number(newVal)||0, 0, TOTAL);
    const remain = Math.max(0, TOTAL - out[editedIndex]);
    const idxs=[]; for(let i=0;i<out.length;i++) if(i!==editedIndex) idxs.push(i);
    const sumOthers = idxs.reduce((s,i)=>s+(vals[i]||0),0);
    if(sumOthers<=1e-9){
      const each = remain/Math.max(1,idxs.length);
      idxs.forEach(i=> out[i]=each);
    }else{
      const sc = remain/sumOthers;
      idxs.forEach(i=> out[i]=(vals[i]||0)*sc);
    }
    return out;
  }

  // persist original transform and translate afterwards
  function ensureBaseTransform(el){
    if(!el.__baseXform){
      el.__baseXform = el.getAttribute('transform') || '';
    }
    return el.__baseXform;
  }
  function translateTo(el, dx, dy){
    const base = ensureBaseTransform(el);
    const t = `translate(${(+dx||0)} ${(+dy||0)})`;
    el.setAttribute('transform', base ? `${base} ${t}` : t);
  }

  function analyze(svg){
    const {sx,sy} = effectiveScale(svg);
    const paths = $$('path', svg);

    const infills = paths.filter(p=>/^infill_\d+$/i.test(p.id||''))
      .map(el=>({el, box:safeBBox(el)})).filter(x=>x.box);
    if(!infills.length) return null;


	  // --- cache original bbox + d once for every infill
  infills.forEach(p => {
    if (!p.el.__origBBox) {
      const b = safeBBox(p.el);
      p.el.__origBBox = b;
      p.el.__origD = p.el.getAttribute('d');
    }
  });



	// --- cache original infill boxes so first apply uses exact authored coords
const ORIGINAL_BOXES = {};
infills.forEach(p => {
  ORIGINAL_BOXES[p.el.id] = { ...p.box };
});


    const openings = paths.filter(p=>/^opening_\d+/i.test(p.id||''));
    const vents    = paths.filter(p=>/^vent_\d+_\d+$/i.test(p.id||''));
    const mullions = paths.filter(p=>/^mullion_\d+$/i.test(p.id||''))
      .map(el=>({el, box:safeBBox(el)})).filter(x=>x.box);

    // --- handles: ONLY ids that contain the word "handle" (case-insensitive)
    // Works for any element type with an id; keeps tiny-ish ones to avoid false positives.
    const handleCandidates = Array.from(svg.querySelectorAll('[id]'))
      .filter(el => /(^|[^a-z])handle([^a-z]|$)/i.test(el.id || ''))
      .map(el => ({ el, box: safeBBox(el) }))
      .filter(x => x.box);
    const unionTemp = (() => {
      const l = Math.min(...infills.map(p=>p.box.left));
      const r = Math.max(...infills.map(p=>p.box.right));
      const t = Math.min(...infills.map(p=>p.box.top));
      const b = Math.max(...infills.map(p=>p.box.bottom));
      return {w:r-l, h:b-t};
    })();
    const unionArea = unionTemp.w * unionTemp.h;
    const handlesRaw = handleCandidates.filter(x => (x.box.width * x.box.height) <= unionArea * 0.2);

    const union = {
      minX: Math.min(...infills.map(p=>p.box.left)),
      maxX: Math.max(...infills.map(p=>p.box.right)),
      minY: Math.min(...infills.map(p=>p.box.top)),
      maxY: Math.max(...infills.map(p=>p.box.bottom))
    }; union.w = union.maxX-union.minX; union.h = union.maxY-union.minY;

    // --- rows
    const hMed = median(infills.map(p=>p.box.height));
    const tolY = Math.max(1, Math.min(union.h*0.06, hMed*0.35));
    const rowCenters = clusterCenters(infills.map(p=>p.box.cy), tolY);
    if(!rowCenters.length) rowCenters.push(union.minY+union.h/2);

    const rows = rowCenters.map((cy,idx)=>({ idx, cy, items:[] }));
    for(const p of infills){
      const ri = nearestIdx(p.box.cy, rowCenters);
      rows[ri].items.push(p);
    }
    rows.forEach(r=>{
      const top = Math.min(...r.items.map(p=>p.box.top));
      const bot = Math.max(...r.items.map(p=>p.box.bottom));
      r.top = top; r.bottom = bot; r.height = bot-top;
      r.items.sort((a,b)=> a.box.left - b.box.left);
    });
    const R = rows.filter(r=>r.items.length>0);

    // --- vents mapping
    const ventGroups = new Map();
    for(const v of vents){
      const m=v.id.match(/^vent_(\d+)_/i); if(!m) continue;
      const k=m[1]; if(!ventGroups.has(k)) ventGroups.set(k, []);
      ventGroups.get(k).push(v);
    }
    function bboxOfPaths(arr){
      const boxes = arr.map(v=>safeBBox(v)).filter(Boolean);
      if(!boxes.length) return null;
      return rect(
        Math.min(...boxes.map(b=>b.left)), Math.min(...boxes.map(b=>b.top)),
        Math.max(...boxes.map(b=>b.right)), Math.max(...boxes.map(b=>b.bottom))
      );
    }
    function pickVentForPanel(panelBox){
      let best=null;
      const EPS = Math.max(1, Math.min(20, Math.min(panelBox.width, panelBox.height) * 0.02));
      for (const arr of ventGroups.values()){
        const outer = bboxOfPaths(arr);
        if(!outer) continue;
        const off = {
          left:   panelBox.left   - outer.left,
          top:    panelBox.top    - outer.top,
          right:  outer.right     - panelBox.right,
          bottom: outer.bottom    - panelBox.bottom
        };
        const bad = (off.left < -EPS) || (off.top < -EPS) || (off.right < -EPS) || (off.bottom < -EPS);
        const score = Math.abs(off.left)+Math.abs(off.top)+Math.abs(off.right)+Math.abs(off.bottom) + (bad?1e6:0);
        const ordered = arr.slice().sort((a,b)=>a.id.localeCompare(b.id));
        if (!best || score < best.score) best = { arr: ordered, off, score };
      }
      return best;
    }
    const panelVents = infills.map(p=> pickVentForPanel(p.box));
    function updateVentForPanel(idx, inner){
      const g = panelVents[idx]; if(!g) return;
      const [v1,v2,v3,v4] = g.arr || [];
      if(!v1||!v2||!v3||!v4) return;
      const off=g.off;
      const il=+inner.left, it=+inner.top, ir=+inner.right, ib=+inner.bottom;
      const ol=il-off.left, ot=it-off.top, or=ir+off.right, ob=ib+off.bottom;

      const p1 = `M${il} ${ib} L${ir} ${ib} L${or} ${ob} L${ol} ${ob} Z`;
      const p2 = `M${ir} ${ib} L${ir} ${it} L${or} ${ot} L${or} ${ob} Z`;
      const p3 = `M${ir} ${it} L${il} ${it} L${ol} ${ot} L${or} ${ot} Z`;
      const p4 = `M${il} ${it} L${il} ${ib} L${ol} ${ob} L${ol} ${ot} Z`;

      if(!_hasBad(p1)) setD(v1, p1);
      if(!_hasBad(p2)) setD(v2, p2);
      if(!_hasBad(p3)) setD(v3, p3);
      if(!_hasBad(p4)) setD(v4, p4);
    }

    // openings normalized to their infill
    const openingsNorm = openings.map(el=>{
      const d=el.getAttribute('d'), pts=pathPts(d);
      const norm = pts.map(p=>{
        let idx=-1;
        for(let i=0;i<infills.length;i++){ const b=infills[i].box; if(inside(p,b)){ idx=i; break; } }
        if(idx<0) return {panel:null, x:p.x, y:p.y};
        const b=infills[idx].box, w=b.width||1, h=b.height||1;
        return {panel:idx, tx:(p.x-b.left)/w, ty:(p.y-b.top)/h};
		      });
      return {el, norm};
    });

    // mullions metadata + base centers
    const mullMeta = mullions.map(m=>{
      const b=m.box, isV=b.height>=b.width, thick = isV? b.width : b.height;
      return {el:m.el, box:b, isV, thick, cx:(b.left+b.right)/2, cy:(b.top+b.bottom)/2};
    });

 const handleGroups  = Array.from(svg.querySelectorAll('g[id^="handle_handle_"]'));
const handleAnchors = handleGroups.map(g => extractHandleAnchor(g, infills));

    // ---------- ragged model ----------
    function raggedModel(){
      // preserve original gaps from geometry (don’t invent thickness)
      const rowVGap = R.map(r=>{
        const gaps=[]; for(let i=0;i<r.items.length-1;i++){
          const a=r.items[i].box, b=r.items[i+1].box;
          gaps.push(Math.max(0, b.left - a.right));
        }
        return gaps;
      });
      const rowHGap = []; for(let ri=0;ri<R.length-1;ri++){
        rowHGap.push(Math.max(0, R[ri+1].top - R[ri].bottom));
      }

      const rowHeights = R.map(r=> modelToUi(r.height, 'y', sx, sy));
      const rowWidths  = R.map(r=> r.items.map(p=> modelToUi(p.box.width, 'x', sx, sy)));
      const Hgap = rowHGap.reduce((a,b)=>a+b,0);
      const totalHUI = modelToUi(union.h - Hgap, 'y', sx, sy);

      // remember mullion attachment to nearest seam (center-of-gap + offset)
      const mullAttach = new Map();
      (function computeMullionAttachments(){
        const initRowTop=[], initRowBottom=[];
        { let y=union.minY;
          for(let ri=0;ri<R.length;ri++){
            const T = y, B = T + R[ri].height; initRowTop.push(T); initRowBottom.push(B);
            y = B + (ri<rowHGap.length? rowHGap[ri] : 0);
          }
        }
        for(const m of mullMeta){
          ensureBaseTransform(m.el);
          if(m.isV){
            let bestRow=0, bestOverlap=0;
            for(let ri=0;ri<R.length;ri++){
              const top = Math.max(initRowTop[ri], m.box.top);
              const bot = Math.min(initRowBottom[ri], m.box.bottom);
              const ov  = Math.max(0, bot - top);
              if(ov>bestOverlap){ bestOverlap=ov; bestRow=ri; }
            }
            const r = R[bestRow];
            if(r.items.length<=1) continue;
            let bestIdx=0, bd=Infinity;
            for(let i=0;i<r.items.length-1;i++){
              const boundary = r.items[i].box.right;
              const mid = boundary + (rowVGap[bestRow][i]||0)/2;
              const d = Math.abs(m.cx - mid);
              if(d<bd){ bd=d; bestIdx=i; }
            }
            const boundary = r.items[bestIdx].box.right;
            const mid = boundary + (rowVGap[bestRow][bestIdx]||0)/2;
            mullAttach.set(m.el, {kind:'v', row:bestRow, idx:bestIdx, offset:m.cx - mid, baseCx:m.cx, baseCy:m.cy});
          }else{
            if(R.length<2) continue;
            let best=0, bd=Infinity;
            for(let ri=0;ri<R.length-1;ri++){
              const yTop  = initRowBottom[ri];
              const mid   = yTop + (rowHGap[ri]||0)/2;
              const d = Math.abs(m.cy - mid);
              if(d<bd){ bd=d; best=ri; }
            }
            const yTop = initRowBottom[best];
            const mid = yTop + (rowHGap[best]||0)/2;
            mullAttach.set(m.el, {kind:'h', row:best, offset:m.cy - mid, baseCx:m.cx, baseCy:m.cy});
          }
        }
      })();

 function apply(rowHeightsUI, rowWidthsUI){
  let rowsM = rowHeightsUI.map(v=> uiToModel(Number(v)||0, 'y', sx, sy));
  const sumH = rowsM.reduce((a,b)=>a+b,0)||1;
  const targetH = union.h - Hgap;
  rowsM = rowsM.map(v=> v*(targetH/sumH));

  const rowTop=[], rowBottom=[];
  { let y=union.minY;
    for(let ri=0;ri<R.length;ri++){
      const T=y, B=T+rowsM[ri]; rowTop.push(T); rowBottom.push(B);
      y = B + (ri<rowHGap.length? rowHGap[ri] : 0);
    }
  }

  const newBoxes = {};
  for(let ri=0;ri<R.length;ri++){
    const r = R[ri];
    const gaps = rowVGap[ri];
    const left0 = Math.min(...r.items.map(p=>p.box.left));
    const right0 = Math.max(...r.items.map(p=>p.box.right));
    const totalFree = (right0 - left0) - gaps.reduce((a,b)=>a+b,0);

    let wM = (rowWidthsUI[ri]||[]).slice(0,r.items.length).map(v=> uiToModel(Number(v)||0,'x',sx,sy));
    const s = totalFree / ((wM.reduce((a,b)=>a+b,0)) || 1);
    wM = wM.map(v=> Math.max(0,v*s));

    let x = left0;
    for(let ci=0;ci<r.items.length;ci++){
      const item = r.items[ci];
      const L=x, Rr=L+wM[ci];
      newBoxes[item.el.id] = { left:L, right:Rr, top:rowTop[ri], bottom:rowBottom[ri] };
      x = Rr + (ci<gaps.length? gaps[ci] : 0);
    }
  }

  // --- redraw infills as rects
  for (let i = 0; i < infills.length; i++) {
    const b = newBoxes[infills[i].el.id];
    if (b) {
      const pathD = rectPath(b.left, b.top, b.right, b.bottom);
      setD(infills[i].el, pathD);
      infills[i].el.removeAttribute('transform');
    }
  }

  // vents
  for(let i=0;i<infills.length;i++) updateVentForPanel(i, newBoxes[infills[i].el.id]);

  // openings
  const ptsToPath = pts => { if(!pts.length) return ''; let s=`M${pts[0].x} ${pts[0].y}`; for(let i=1;i<pts.length;i++) s+=` L${pts[i].x} ${pts[i].y}`; return s; };
  for(const o of openingsNorm){
    const pts = o.norm.map(p=>{
      if(p.panel==null) return {x:p.x,y:p.y};
      const b=newBoxes[infills[p.panel].el.id], w=b.right-b.left, h=b.bottom-b.top;
      return {x:b.left + p.tx*w, y:b.top + p.ty*h};
    });
    setD(o.el, ptsToPath(pts));
  }

  // mullions
  for(const m of mullMeta){
    const att = mullAttach.get(m.el);
    if(!att) continue;
    if(att.kind==='v'){
      const r = R[att.row];
      const boundary = newBoxes[r.items[att.idx].el.id].right;
      const gapW = (rowVGap[att.row][att.idx]||0);
      const targetCx = boundary + gapW/2 + att.offset;
      const dx = targetCx - att.baseCx;
      translateTo(m.el, dx, 0);
    }else{
      const yTop = rowBottom[att.row];
      const gapH = (rowHGap[att.row]||0);
      const targetCy = yTop + gapH/2 + att.offset;
      const dy = targetCy - att.baseCy;
      translateTo(m.el, 0, dy);
    }
  }

  // handles
  for (const h of handleAnchors) {
    const b = newBoxes[infills[h.panel].el.id];
    if (!b) continue;
    const x = b.left + h.nx * (b.right - b.left);
    const y = b.top  + h.ny * (b.bottom - b.top);
    h.el.setAttribute('transform', `translate(${x},${y})${h.rest}`);
  }
}

      return {
        mode:'ragged',
        rows: R.map(r=>({ count:r.items.length })),
        rowHeightsUI: rowHeights.slice(),
        rowWidthsUI: rowWidths.map(a=>a.slice()),
        totalHUI,
        apply,
        infillCount: infills.length,
        mullionCount: mullions.length
      };
    }

    // choose ragged grid when rows differ
    const distinctCounts = new Set(rows.map(r=>r.items.length)).size;
    if(distinctCounts>1 || rows.length>1){
      return raggedModel();
    }

    // ---------- 1D ----------
    let axis='x';
    if(mullions.length){
      let tall=0, wide=0;
      mullions.forEach(m=> (m.box.height>=m.box.width? tall++ : wide++));
      axis = (tall>=wide)?'x':'y';
    }else{
      const xs=infills.map(p=>p.box.cx), ys=infills.map(p=>p.box.cy);
      axis = ((Math.max(...ys)-Math.min(...ys)) >= (Math.max(...xs)-Math.min(...xs))) ? 'y' : 'x';
    }
    const arr = infills.slice().sort((a,b)=> axis==='x' ? (a.box.cx-b.box.cx) : (a.box.cy-b.box.cy));

    const gaps = [];
    for(let i=0;i<arr.length-1;i++){
      const a=arr[i].box, b=arr[i+1].box;
      gaps.push(axis==='x' ? Math.max(0, b.left - a.right) : Math.max(0, b.top - a.bottom));
    }
    const totalMin = axis==='x' ? Math.min(...arr.map(p=>p.box.left)) : Math.min(...arr.map(p=>p.box.top));
    const totalMax = axis==='x' ? Math.max(...arr.map(p=>p.box.right)) : Math.max(...arr.map(p=>p.box.bottom));
    const totalPanels = (totalMax-totalMin) - gaps.reduce((a,b)=>a+b,0);

    const curUI = arr.map(p=> modelToUi(axis==='x'?p.box.width:p.box.height, axis, sx, sy));
    const totalUI = modelToUi(totalPanels, axis, sx, sy);

    const mullAttach1D = new Map();
    (function compute1DAttach(){
      for(const m of mullMeta){
        ensureBaseTransform(m.el);
        if( (axis==='x' && m.isV) || (axis==='y' && !m.isV) ){
          let best=0, bd=Infinity;
          for(let i=0;i<arr.length-1;i++){
            const boundary = axis==='x' ? arr[i].box.right : arr[i].box.bottom;
            const mid = boundary + (gaps[i]||0)/2;
            const c = axis==='x' ? m.cx : m.cy;
            const d = Math.abs(c - mid);
            if(d<bd){ bd=d; best=i; }
          }
          const boundary = axis==='x' ? arr[best].box.right : arr[best].box.bottom;
          const mid = boundary + (gaps[best]||0)/2;
          const offset = (axis==='x'?m.cx:m.cy) - mid;
          mullAttach1D.set(m.el, {idx:best, offset, baseCx:m.cx, baseCy:m.cy});
        }
      }
    })();

  // 1D mode
const handleAnchors1D = handleGroups.map(g => extractHandleAnchor(g, arr));


function apply1D(uiLens){
  const toModel = v=> uiToModel(Number(v)||0, axis, sx, sy);
  let vals = (uiLens||[]).slice(0,arr.length).map(v=>Math.max(0,toModel(v)));
  const s = totalPanels / ((vals.reduce((a,b)=>a+b,0)) || 1);
  vals = vals.map(v=> Math.max(0, v*s));

  const newBoxes=[], centers=[];
  let cur = totalMin;
  for(let i=0;i<arr.length;i++){
    if(axis==='x'){
      const top=arr[i].box.top, bottom=arr[i].box.bottom;
      const left=cur, right=cur+vals[i];
      newBoxes.push({left,top,right,bottom});
      cur = right;
      if(i<gaps.length){ centers.push(cur + gaps[i]/2); cur += gaps[i]; }
    }else{
      const left=arr[i].box.left, right=arr[i].box.right;
      const top=cur, bottom=cur+vals[i];
      newBoxes.push({left,top,right,bottom});
      cur = bottom;
      if(i<gaps.length){ centers.push(cur + gaps[i]/2); cur += gaps[i]; }
    }
  }

  // --- redraw infills as rects
  for (let i = 0; i < arr.length; i++) {
    const b = newBoxes[i];
    if (b) {
      const pathD = rectPath(b.left, b.top, b.right, b.bottom);
      setD(arr[i].el, pathD);
      arr[i].el.removeAttribute('transform');
    }
  }

  // vents + openings
  for(let i=0;i<arr.length;i++) updateVentForPanel(i, newBoxes[i]);

  const ptsToPath = pts => { if(!pts.length) return ''; let s = `M${pts[0].x} ${pts[0].y}`; for(let i=1;i<pts.length;i++) s+=` L${pts[i].x} ${pts[i].y}`; return s; };
  for(const o of openingsNorm){
    const pts = o.norm.map(p=>{
      if(p.panel==null) return {x:p.x,y:p.y};
      const b=newBoxes[p.panel], w=b.right-b.left, h=b.bottom-b.top;
      return {x:b.left + p.tx*w, y:b.top + p.ty*h};
    });
    setD(o.el, ptsToPath(pts));
  }

  // mullions
  for(const m of mullMeta){
    const att = mullAttach1D.get(m.el);
    if(!att) continue;
    const boundary = axis==='x' ? newBoxes[att.idx].right : newBoxes[att.idx].bottom;
    const mid = boundary + (gaps[att.idx]||0)/2;
    if(axis==='x'){
      const dx = (mid + att.offset) - att.baseCx;
      translateTo(m.el, dx, 0);
    }else{
      const dy = (mid + att.offset) - att.baseCy;
      translateTo(m.el, 0, dy);
    }
  }

  // handles
  for (const h of handleAnchors1D) {
    const b = newBoxes[h.panel];
    if (!b) continue;
    const x = b.left + h.nx * (b.right - b.left);
    const y = b.top  + h.ny * (b.bottom - b.top);
    h.el.setAttribute('transform', `translate(${x},${y})${h.rest}`);
  }
}

  return {
  mode: '1d',
  axis,
  infillCount: infills.length,
  mullionCount: mullions.length,
  currentLensUI: curUI,
  totalUI,
  apply1D,
  updateMullionAnchors() {
    for (const m of mullMeta) {
      const el = m.el;
      const box = el.getBBox();
      const att = mullAttach1D.get(el);
      if (att) {
        att.baseCx = box.x + box.width / 2;
        att.baseCy = box.y + box.height / 2;
      }
    }
  }
};

  }

  // ---------- UI ----------
function ensurePanel(){
  let box = document.getElementById(GROUP_ID);
  if(!box){
    // mount inside tab4 instead of floating
    const host = document.querySelector('#tab4');
    if(!host) return null;

    box = document.createElement('div');
    box.id = GROUP_ID;
    // remove all the floating CSS you had before
    Object.assign(box.style, {
      marginTop:'10px'
    });

    const title = document.createElement('div');
    title.textContent = 'INPUTS';
    Object.assign(title.style,{fontWeight:'700',marginBottom:'6px'});
    box.appendChild(title);

    host.appendChild(box);
  }
  return box;
}

  function mkSection(box, title){
    const sec = document.createElement('div'); sec.className='sec';
    //Object.assign(sec.style,{border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px', margin:'6px 0'});
    const h = document.createElement('div'); h.textContent = title; h.style.fontWeight='600'; h.style.marginBottom='6px';
    sec.appendChild(h); box.appendChild(sec); return sec;
  }

function buildInputs(model){
  const box = ensurePanel();
  if (!box) return;

  // 🚨 Always nuke old content first
  box.querySelectorAll('.sec, .note').forEach(n => n.remove());

  const mainW = document.getElementById('width');
  const mainH = document.getElementById('height');
  const wVal  = mainW ? Number(mainW.value) : 0;
  const hVal  = mainH ? Number(mainH.value) : 0;

  // If invalid model → hide panel and exit
  if (!model || model.infillCount <= 1 || model.mullionCount === 0 || !wVal || !hVal) {
    box.style.display = 'none';
    return;
  }

  // Otherwise show the panel
  box.style.display = '';

  function refreshMeasurements(){
    const svgNode = getSVG();
    if (svgNode) {
      const vb = (svgNode.getAttribute('viewBox') || '').split(/\s+/).map(Number);
      const vbW = +svgNode.getAttribute('width')  || vb[2] || 400;
      const vbH = +svgNode.getAttribute('height') || vb[3] || 400;
      drawSelectedMeasurements(svgNode, 0, 0, vbW, vbH, vbW, vbH);
    }
  }

  if(model.mode==='ragged'){
    const hasV = model.rows.some(r => r.count > 1);
    const hasH = model.rows.length > 1;

    let rowH = model.rowHeightsUI.slice();
    let rowW = model.rowWidthsUI.map(a=>a.slice());

    const hInputs=[], wInputs=[];

    // Heights
    if(hasH){
      const secH = mkSection(box);
      const totalRaw = rowH.reduce((a,b)=>a+b,0);
      for(let r=0;r<rowH.length;r++){
        const wrap=document.createElement('div'); wrap.style.margin='6px 0';
        const id=`rowH${r+1}`;
        const lab=document.createElement('label'); lab.setAttribute('for',id); lab.textContent=`Element ${r+1} (mm)`;
        const inp=document.createElement('input'); inp.type='number'; inp.step='1'; inp.min='0'; inp.id=id;
        //Object.assign(inp.style,{width:'100%',padding:'6px 8px',border:'1px solid #cfd3d7',borderRadius:'6px'});

        const rawVal = rowH[r];
     const uiVal = Math.round(hVal / rowH.length);   // equal split
inp.value = uiVal;

// adjust last to absorb rounding remainder
if (r === rowH.length - 1) {
  const sumPrev = hInputs.reduce((s,el)=> s + (+el.value||0), 0);
  inp.value = hVal - sumPrev;
}


        inp.dataset.scale  = uiVal / rawVal;
        inp.dataset.rawMin = 0;
        inp.dataset.rawMax = rawVal * 10;

        wrap.appendChild(lab); wrap.appendChild(inp); secH.appendChild(wrap);
        hInputs.push(inp);
      }

      // ✅ Fix: adjust last height so sum matches hVal
      if (hInputs.length > 1) {
        const sum = hInputs.slice(0,-1).reduce((s,el)=>s + (+el.value||0),0);
        hInputs[hInputs.length-1].value = hVal - sum;
      }
    }

    // Widths
    if(hasV){
      for(let r=0;r<rowW.length;r++){
        const sec = mkSection(box, `Breiten in Reihe ${r+1} (mm)`);
        const totalRaw = rowW[r].reduce((a,b)=>a+b,0);
        wInputs[r]=[];
        for(let c=0;c<rowW[r].length;c++){
          const wrap=document.createElement('div'); wrap.style.margin='6px 0';
          const id=`row${r+1}col${c+1}`;
          const lab=document.createElement('label'); lab.setAttribute('for',id); lab.textContent=`Element ${c+1} (mm) → Siehe Visualisierung`;
          const inp=document.createElement('input'); inp.type='number'; inp.step='1'; inp.min='0'; inp.id=id;
          Object.assign(inp.style,{width:'100%',padding:'6px 8px',border:'1px solid #cfd3d7',borderRadius:'6px'});

          const rawVal = rowW[r][c];
     const uiVal = Math.round(wVal / rowW[r].length);  // equal split
inp.value = uiVal;

if (c === rowW[r].length - 1) {
  const sumPrev = (wInputs[r]||[]).reduce((s,el)=> s + (+el.value||0), 0);
  inp.value = wVal - sumPrev;
}


          inp.dataset.scale  = uiVal / rawVal;
          inp.dataset.rawMin = 0;
          inp.dataset.rawMax = rawVal * 10;

          wrap.appendChild(lab); wrap.appendChild(inp); sec.appendChild(wrap);
          wInputs[r].push(inp);
        }

        // ✅ Fix: adjust last width so sum matches wVal
        if (wInputs[r].length > 1) {
          const sum = wInputs[r].slice(0,-1).reduce((s,el)=>s + (+el.value||0),0);
          wInputs[r][wInputs[r].length-1].value = wVal - sum;
        }
      }
    }

    function writeRowHExcept(skip){
      const totalRaw = rowH.reduce((a,b)=>a+b,0);
      hInputs.forEach((el,i)=>{
        if(i!==skip){
          const ratio = rowH[i] / totalRaw;
          el.value = Math.round(hVal * ratio);
        }
      });
    }

    function writeRowWExcept(r,skip){
      const totalRaw = rowW[r].reduce((a,b)=>a+b,0);
      (wInputs[r]||[]).forEach((el,i)=>{
        if(i!==skip){
          const ratio = rowW[r][i] / totalRaw;
          el.value = Math.round(wVal * ratio);
        }
      });
    }

function onRowH(r) {
  let uiVal = +hInputs[r].value || 0;
  uiVal = Math.max(0, Math.min(uiVal, hVal));   // clamp inside 0..total height
  hInputs[r].value = uiVal;

  let values = hInputs.map(el => +el.value || 0);

  // force last input to absorb remainder
  if (hInputs.length > 1) {
    const sum = values.slice(0, -1).reduce((s, v) => s + v, 0);
    values[values.length - 1] = Math.max(0, hVal - sum);
    hInputs[hInputs.length - 1].value = values[values.length - 1];
  }

  // normalize into model space
  rowH = values.map(v => uiToModel(v, 'y', 1, 1));
  model.apply(rowH, rowW);
}

function onRowW(r, c) {
  let uiVal = +wInputs[r][c].value || 0;
  uiVal = Math.max(0, Math.min(uiVal, wVal));   // clamp inside 0..total width
  wInputs[r][c].value = uiVal;

  let values = wInputs[r].map(el => +el.value || 0);

  // force last input to absorb remainder
  if (wInputs[r].length > 1) {
    const sum = values.slice(0, -1).reduce((s, v) => s + v, 0);
    values[values.length - 1] = Math.max(0, wVal - sum);
    wInputs[r][wInputs[r].length - 1].value = values[values.length - 1];
  }

  rowW[r] = values.map(v => uiToModel(v, 'x', 1, 1));
  model.apply(rowH, rowW);
}

    hInputs.forEach((inp,r)=>{
      const h=()=>onRowH(r);
      inp.addEventListener('input', h);
      inp.addEventListener('change', h);
      inp.addEventListener('keydown', e=>{ if(e.key==='Enter') h(); });
    });
    for(let r=0;r<wInputs.length;r++){
      for(let c=0;c<(wInputs[r]||[]).length;c++){
        const h=()=>onRowW(r,c);
        const inp=wInputs[r][c];
        inp.addEventListener('input', h);
        inp.addEventListener('change', h);
        inp.addEventListener('keydown', e=>{ if(e.key==='Enter') h(); });
      }
    }

  } else {
    // ---------------- 1D ----------------
    const axisWord = (model.axis==='y') ? 'HÖHE' : 'BREITE';
    let vals = model.currentLensUI.slice();
    const TOTAL = model.totalUI;

    const sec = mkSection(box);
    const inputs=[];
    const totalRaw = vals.reduce((a,b)=>a+b,0);
    const outer    = (model.axis==='x') ? wVal : hVal;

    for(let i=0;i<model.infillCount;i++){
      const wrap=document.createElement('div'); wrap.style.margin='6px 0';
      const id=`el${i+1}`;
      const lab=document.createElement('label'); lab.setAttribute('for',id); lab.textContent=`Element ${i+1} (mm) → Siehe Visualisierung`;
      const inp=document.createElement('input'); inp.type='number'; inp.step='1'; inp.min='0'; inp.id=id;
      Object.assign(inp.style,{width:'100%',padding:'6px 8px',border:'1px solid #cfd3d7',borderRadius:'6px'});

      const rawVal = vals[i];
      const ratio  = rawVal / totalRaw;
      const uiVal  = Math.round(outer * ratio);
      inp.value = uiVal;

      inp.dataset.scale  = uiVal / rawVal;
      inp.dataset.rawMin = 0;
      inp.dataset.rawMax = rawVal * 10;

      wrap.appendChild(lab); wrap.appendChild(inp); sec.appendChild(wrap);
      inputs.push(inp);
    }

    // ✅ Fix: adjust last so sum matches outer
    if (inputs.length > 1) {
      const sum = inputs.slice(0,-1).reduce((s,el)=>s + (+el.value||0),0);
      inputs[inputs.length-1].value = outer - sum;
    }

    function writeExcept(skip){
      const totalRaw = vals.reduce((a,b)=>a+b,0);
      const outer    = (model.axis==='x') ? wVal : hVal;
      inputs.forEach((el,i)=>{
        if(i!==skip){
          const ratio = vals[i] / totalRaw;
          el.value = Math.round(outer * ratio);
        }
      });
    }

  function onEdit(i) {
  const outer = (model.axis === 'x') ? wVal : hVal;
  let uiVal = +inputs[i].value || 0;
  uiVal = Math.max(0, Math.min(uiVal, outer));   // clamp inside 0..outer
  inputs[i].value = uiVal;

  let values = inputs.map(el => +el.value || 0);

  // force last input to absorb remainder
  if (inputs.length > 1) {
    const sum = values.slice(0, -1).reduce((s, v) => s + v, 0);
    values[values.length - 1] = Math.max(0, outer - sum);
    inputs[inputs.length - 1].value = values[values.length - 1];
  }

  model.apply1D(values);
}

    inputs.forEach((inp,i)=>{
      const h=()=>onEdit(i);
      inp.addEventListener('input', h);
      inp.addEventListener('change', h);
      inp.addEventListener('keydown', e=>{ if(e.key==='Enter') h(); });
    });
  }
}

  // ---------- boot & hooks ----------
  let _timer=0;
  function boot(){ clearTimeout(_timer); _timer=setTimeout(()=>{ const svg=getSVG(); if(!svg) return; const model=analyze(svg); if(!model) return; buildInputs(model); },40); }
  function hookOuterWH(){
    const wEl = document.getElementById('width');
    const hEl = document.getElementById('height');
    const on = () => boot();
    wEl && (wEl.addEventListener('change', on), wEl.addEventListener('blur', on), wEl.addEventListener('keydown', e=>{ if(e.key==='Enter') on(); }));
    hEl && (hEl.addEventListener('change', on), hEl.addEventListener('blur', on), hEl.addEventListener('keydown', e=>{ if(e.key==='Enter') on(); }));
  }
  setTimeout(boot,0);
  hookOuterWH();
  const host = getHost();
  if(host){ const mo = new MutationObserver(()=> requestAnimationFrame(boot)); mo.observe(host, { childList:true, subtree:true }); }
  document.addEventListener('tab4:svg:updated', boot);
})();



function scrollToTabTop(offset = 180) {
  const tabContainer = document.querySelector('.its_my_app_work');
  if (tabContainer) {
    const top = tabContainer.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({
      top: top - offset,
      behavior: 'smooth'
    });
  }
}



function moveTabContentBelowHeader(idx) {
  const tabs = document.querySelectorAll('.tab-link');
  const contents = document.querySelectorAll('.tab-content');

  const tab = tabs[idx];
  const content = contents[idx];

  if (!tab || !content) return;

  // Move content just after the clicked tab header
  tab.insertAdjacentElement('afterend', content);
}

const observer = new MutationObserver(() => {
  document.querySelectorAll('svg:not([data-processed])').forEach(svg => {
    svg.dataset.processed = "true";

    // 🔥 CHECK IF SVG HAS COMMENTS
    const hasComments = svg.innerHTML.includes('<!--');

    if (hasComments) {
      mapCommentsToSVG(svg);        // existing logic
    } else {
      mapSVGWithoutComments(svg);   // fallback logic
    }

  });
});

document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.rollladen-inquiry-modal.is-open').forEach(closeRollladenInquiryModal);
});
