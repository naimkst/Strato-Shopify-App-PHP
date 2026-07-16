(function () {
  'use strict';

  var PANEL_ID = 'rollladen-cart-inquiry-panel';
  var MODAL_ID = 'rollladen-cart-inquiry-modal';
  var STYLE_ID = 'rollladen-cart-inquiry-style';
  var CHECKOUT_SELECTORS = [
    'button[name="checkout"]',
    'input[name="checkout"]',
    'button[type="submit"][name="checkout"]',
    'input[type="submit"][name="checkout"]',
    '[formaction*="/checkout"]',
    'a[href*="/checkout"]',
    '.cart__checkout-button',
    '#checkout'
  ];
  var EXTRA_CHECKOUT_SELECTORS = [
    'shopify-accelerated-checkout-cart',
    'shopify-accelerated-checkout',
    '.additional-checkout-buttons',
    '.dynamic-checkout__content'
  ];

  if (!/^\/cart\/?$/.test(window.location.pathname)) return;

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss');
  }

  function getProperties(item) {
    var props = item && item.properties;
    if (!props) return {};
    if (Array.isArray(props)) {
      return props.reduce(function (acc, prop) {
        if (prop && prop.name) acc[prop.name] = prop.value;
        return acc;
      }, {});
    }
    return props;
  }

  function hasRollladen(item) {
    var props = getProperties(item);
    if (normalize(props['_Rollladen Anfrage']) === 'ja') return true;

    return Object.keys(props).some(function (key) {
      var value = props[key];
      if (value === null || value === undefined || value === '') return false;
      return normalize(key).includes('rollladen') || normalize(value).includes('rollladen');
    });
  }

  function getRollladenItems(cart) {
    return ((cart && cart.items) || []).filter(hasRollladen);
  }

  function formatLine(item, index) {
    var props = getProperties(item);
    var lines = [
      'Artikel ' + (index + 1) + ':',
      'Produkt: ' + (item.product_title || item.title || 'Konfigurator Produkt'),
      'Menge: ' + (item.quantity || 1)
    ];

    if (item.variant_title && item.variant_title !== 'Default Title') {
      lines.push('Variante: ' + item.variant_title);
    }

    Object.keys(props).forEach(function (key) {
      var value = props[key];
      if (!value || key.charAt(0) === '_') return;
      lines.push(key + ': ' + value);
    });

    if (item.url) lines.push('Produkt URL: ' + window.location.origin + item.url);
    return lines.join('\n');
  }

  function buildInquiryMessage(cart) {
    var items = getRollladenItems(cart);
    var lines = [
      'Rollladen-Anfrage aus dem Warenkorb',
      'Warenkorb URL: ' + window.location.href,
      'Anzahl Rollladen-Positionen: ' + items.length,
      ''
    ];

    items.forEach(function (item, index) {
      lines.push(formatLine(item, index), '');
    });

    return lines.join('\n').trim();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.rollladen-cart-inquiry-panel{margin:18px 0;padding:18px;border:1px solid rgba(11,45,96,.18);background:#f7f8fb;text-align:left}',
      '.rollladen-cart-inquiry-panel strong{display:block;margin:0 0 6px;color:#0b2d60;font-size:18px;line-height:1.25}',
      '.rollladen-cart-inquiry-panel p{margin:0 0 14px;color:#333;font-size:14px;line-height:1.45}',
      '.rollladen-cart-inquiry-button{width:100%;border:0;background:#0b2d60;color:#fff;padding:14px 18px;font-weight:700;font-size:16px;cursor:pointer}',
      '.rollladen-inquiry-modal{position:fixed;inset:0;z-index:2147483647!important;display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}',
      '.rollladen-inquiry-modal.is-open{display:flex}',
      '.rollladen-inquiry-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.48)}',
      '.rollladen-inquiry-dialog{position:relative;width:min(560px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:6px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.28);box-sizing:border-box;text-align:left}',
      '.rollladen-inquiry-close{position:absolute;top:12px;right:14px;border:0;background:transparent;font-size:26px;line-height:1;cursor:pointer}',
      '.rollladen-cart-inquiry-form{display:grid;gap:14px}',
      '.rollladen-cart-inquiry-title{margin:0;color:#2d2d2d;font-size:30px;line-height:1.12;font-weight:700}',
      '.rollladen-cart-inquiry-copy{margin:0;color:#555;font-size:14px;line-height:1.45}',
      '.rollladen-cart-inquiry-fields{display:grid;grid-template-columns:1fr;gap:12px}',
      '.rollladen-cart-inquiry-fields label{display:block;color:#2d2d2d;font-size:14px;font-weight:700}',
      '.rollladen-cart-inquiry-fields input{width:100%;box-sizing:border-box;margin-top:6px;border:1px solid #d8d8d8;padding:11px 12px;font:inherit;min-height:44px}',
      '.rollladen-cart-inquiry-submit{justify-self:end;border:0;background:#000;color:#fff;padding:13px 22px;font-size:14px;font-weight:700;cursor:pointer}',
      '@media (max-width:640px){.rollladen-inquiry-dialog{padding:20px 16px}.rollladen-cart-inquiry-title{font-size:25px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function createModal(cart) {
    var modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'rollladen-inquiry-modal rollladen-cart-inquiry-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = [
      '<div class="rollladen-inquiry-backdrop" data-rollladen-cart-close></div>',
      '<div class="rollladen-inquiry-dialog" role="dialog" aria-modal="true" aria-label="Rollladen-Anfrage stellen">',
      '<button type="button" class="rollladen-inquiry-close" aria-label="Schließen" data-rollladen-cart-close>&times;</button>',
      '<form class="rollladen-cart-inquiry-form" method="post" action="/contact#contact_form" accept-charset="UTF-8">',
      '<input type="hidden" name="form_type" value="contact">',
      '<input type="hidden" name="utf8" value="✓">',
      '<input type="hidden" name="contact[tags]" value="Rollladen Anfrage, Warenkorb">',
      '<h2 class="rollladen-cart-inquiry-title">Anfrage stellen</h2>',
      '<p class="rollladen-cart-inquiry-copy">Ihr Warenkorb enthält Rollläden. Senden Sie uns eine Anfrage, wir melden uns mit den nächsten Schritten.</p>',
      '<div class="rollladen-cart-inquiry-fields">',
      '<label>Name*<input type="text" name="contact[name]" required autocomplete="name"></label>',
      '<label>E-Mail*<input type="email" name="contact[email]" required autocomplete="email"></label>',
      '<label>Telefon*<input type="tel" name="contact[phone]" required autocomplete="tel"></label>',
      '</div>',
      '<textarea class="rollladen-cart-inquiry-message" name="contact[body]" hidden></textarea>',
      '<button type="submit" class="rollladen-cart-inquiry-submit">ABSENDEN ›</button>',
      '</form>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);
    updateModalMessage(cart);
    return modal;
  }

  function updateModalMessage(cart) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    var message = modal.querySelector('.rollladen-cart-inquiry-message');
    if (message) message.value = buildInquiryMessage(cart);
  }

  function openModal(cart) {
    ensureStyle();
    var modal = createModal(cart);
    updateModalMessage(cart);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    var first = modal.querySelector('input[name="contact[name]"]');
    if (first) first.focus();
  }

  function closeModal() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function hideElement(el) {
    if (!el || el.dataset.rollladenCartHidden === '1') return;
    el.dataset.rollladenCartHidden = '1';
    el.dataset.rollladenCartDisplay = el.style.display || '';
    el.style.display = 'none';
  }

  function restoreHiddenElements() {
    document.querySelectorAll('[data-rollladen-cart-hidden="1"]').forEach(function (el) {
      el.style.display = el.dataset.rollladenCartDisplay || '';
      delete el.dataset.rollladenCartHidden;
      delete el.dataset.rollladenCartDisplay;
    });
  }

  function getCheckoutElements() {
    return CHECKOUT_SELECTORS.concat(EXTRA_CHECKOUT_SELECTORS).reduce(function (all, selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        if (!all.includes(el)) all.push(el);
      });
      return all;
    }, []);
  }

  function ensurePanel(cart) {
    ensureStyle();
    var panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.className = 'rollladen-cart-inquiry-panel';
      panel.innerHTML = [
        '<strong>Rollläden nur auf Anfrage.</strong>',
        '<p>Ihr Warenkorb enthält konfigurierte Produkte mit Rollläden. Der direkte Checkout ist dafür deaktiviert.</p>',
        '<button type="button" class="rollladen-cart-inquiry-button">Anfrage stellen</button>'
      ].join('');
    }

    panel.querySelector('.rollladen-cart-inquiry-button').onclick = function () {
      openModal(cart);
    };

    var checkoutElements = getCheckoutElements();
    var anchor = checkoutElements[0] || document.querySelector('form[action="/cart"], .cart__footer, cart-footer, main');
    if (anchor && panel.parentNode !== anchor.parentNode) {
      anchor.parentNode.insertBefore(panel, anchor);
    } else if (!panel.parentNode) {
      document.body.appendChild(panel);
    }

    checkoutElements.forEach(hideElement);
    updateModalMessage(cart);
  }

  function removePanel() {
    restoreHiddenElements();
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
    closeModal();
  }

  function loadCart() {
    return fetch('/cart.js', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('Cart load failed');
      return res.json();
    });
  }

  function submitContactForm(form) {
    var action = (form.getAttribute('action') || '/contact#contact_form').split('#')[0] || '/contact';
    return fetch(action, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'text/html,application/xhtml+xml' },
      body: new FormData(form)
    }).then(function (res) {
      if (!res.ok) throw new Error('Inquiry submit failed');
      return res.text();
    });
  }

  function clearCart() {
    return fetch('/cart/clear.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: '{}'
    }).then(function (res) {
      if (!res.ok) throw new Error('Cart clear failed');
      return res.json();
    });
  }

  var latestCart = null;
  var running = false;
  var scheduled = false;

  function applyCartState() {
    if (running) {
      scheduled = true;
      return;
    }

    running = true;
    loadCart()
      .then(function (cart) {
        latestCart = cart;
        if (getRollladenItems(cart).length) ensurePanel(cart);
        else removePanel();
      })
      .catch(function (err) {
        console.warn('[Rollladen Anfrage] Cart check failed', err);
      })
      .finally(function () {
        running = false;
        if (scheduled) {
          scheduled = false;
          setTimeout(applyCartState, 250);
        }
      });
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      applyCartState();
    }, 250);
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-rollladen-cart-close]')) {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('submit', function (event) {
    if (!event.target.matches('.rollladen-cart-inquiry-form')) return;
    event.preventDefault();

    var form = event.target;
    var submitButton = form.querySelector('.rollladen-cart-inquiry-submit');
    if (latestCart) updateModalMessage(latestCart);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'WIRD GESENDET...';
    }

    submitContactForm(form)
      .then(clearCart)
      .then(function () {
        window.location.href = '/';
      })
      .catch(function (err) {
        console.error('[Rollladen Anfrage] Submit failed', err);
        alert('Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'ABSENDEN ›';
        }
      });
  });

  document.addEventListener('DOMContentLoaded', applyCartState);
  window.addEventListener('pageshow', applyCartState);

  if (document.body) {
    new MutationObserver(scheduleApply).observe(document.body, { childList: true, subtree: true });
  }
})();
