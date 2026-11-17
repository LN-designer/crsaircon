(() => {
  'use strict';

  const form = document.getElementById('enquiry-form');
  const fields = document.getElementById('enquiry-fields');
  const dialog = document.getElementById('enquiry-preview');
  const error = document.getElementById('form-error');
  const previewButton = form.querySelector('[type=submit]');
  const nameInput = form.elements.namedItem('name');
  const phoneInput = form.elements.namedItem('phone');
  const detailsInput = form.elements.namedItem('details');

  // Keep native submission blocked even when dialog support is unavailable.
  // All named fields start disabled until this handler has been installed.
  form.addEventListener('submit', event => {
    event.preventDefault();
    error.textContent = '';
    if (fields.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    const value = key => String(data.get(key) || '').trim();
    const digits = value('phone').replace(/\D/g, '');
    if (!value('name') || !value('area')) {
      error.textContent = 'Please add your name and area.';
      (!value('name') ? nameInput : form.elements.namedItem('area')).focus();
      return;
    }
    if (digits.length < 10 || digits.length > 15 || !/^[+0-9 ()-]+$/.test(value('phone')) || /^(\d)\1+$/.test(digits)) {
      error.textContent = 'Please enter a valid mobile number with 10 to 15 digits.';
      phoneInput.focus();
      return;
    }
    const source = new URLSearchParams(location.search).get('utm_content');
    const safeSource = source && /^[a-zA-Z0-9_-]{1,80}$/.test(source) ? source : 'website_enquiry';
    const message = ['Hello CRS Aircon,', '', 'I would like help with: ' + value('need'), 'Name: ' + value('name'), 'Mobile: ' + value('phone'), 'Area: ' + value('area'), ...(value('details') ? ['Details: ' + value('details')] : []), '', 'Please confirm the next step and availability.', 'Source: ' + safeSource].join('\n');
    document.getElementById('message-preview').textContent = message;
    document.getElementById('whatsapp-draft').href = 'https://wa.me/919840073436?text=' + encodeURIComponent(message);
    dialog.showModal();
  });
  const closePreview = () => { dialog.close(); previewButton.focus({ preventScroll: true }); };
  dialog.querySelectorAll('.close-dialog, .edit-enquiry').forEach(button => button.addEventListener('click', closePreview));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePreview();
  });
  if (typeof dialog.showModal === 'function') {
    fields.disabled = false;
    document.getElementById('form-availability').hidden = true;
    document.getElementById('form-privacy').hidden = false;
  }

  const menu = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('navigation');
  const closeMenu = () => { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  const mobileNav = matchMedia('(max-width: 800px)');
  mobileNav.addEventListener('change', closeMenu);
  menu.hidden = false;

  let suggestedDetails = '';
  document.querySelectorAll('.service-choice').forEach(link => link.addEventListener('click', () => {
    const need = Array.from(form.querySelectorAll('[name=need]')).find(input => input.value === link.dataset.need);
    if (need) need.checked = true;
    // A new choice may replace only our own suggestion, never visitor-written text.
    if (!detailsInput.value || detailsInput.value === suggestedDetails) {
      suggestedDetails = link.dataset.detail || '';
      detailsInput.value = suggestedDetails;
    }
  }));

  const systems = {
    split: {category:'ROOM-BY-ROOM COMFORT', title:'A familiar choice.', accent:'A personal fit.', description:'A wall-mounted indoor unit paired with an outdoor unit. A starting point for bedrooms, living rooms and individual workspaces.', spaces:'Bedrooms · living rooms · individual rooms', planning:'Room size, sun exposure, outdoor-unit location and pipe routing.', image:'ac-split.jpg', label:'SPLIT AIR CONDITIONING', name:'a split AC', need:'Home AC purchase / installation'},
    window: {category:'A SELF-CONTAINED OPTION', title:'One compact unit.', accent:'A considered option.', description:'A single unit installed in a suitable window or wall opening. An option to discuss where the structure and room layout allow it.', spaces:'Individual rooms with a suitable opening', planning:'Opening dimensions, structural suitability, ventilation and sound requirements.', image:'ac-window.jpg', label:'WINDOW AIR CONDITIONING', name:'a window AC', need:'Home AC purchase / installation'},
    cassette: {category:'A PLACE IN THE CEILING', title:'Above the everyday.', accent:'Around your space.', description:'A ceiling-mounted indoor unit to consider for open rooms, shops and workplaces. Ceiling conditions and the required coverage guide the design.', spaces:'Offices · retail · open interior spaces', planning:'Ceiling void, drainage, service access and air distribution.', image:'ac-cassette.jpg', label:'CASSETTE AIR CONDITIONING', name:'a cassette system', need:'Commercial cooling / project'},
    ducted: {category:'COOLING, INTEGRATED', title:'Behind the scenes.', accent:'Part of the plan.', description:'Concealed indoor equipment distributes conditioned air through ducts. The duct layout and installation need to be considered alongside the interior.', spaces:'Planned interiors · larger rooms · commercial spaces', planning:'Duct routes, ceiling space, insulation, access and room-by-room requirements.', image:'ac-ductable.jpg', label:'DUCTED AIR CONDITIONING', name:'a ducted system', need:'Commercial cooling / project'},
    vrf: {category:'A CONNECTED SYSTEM', title:'Many spaces.', accent:'One considered plan.', description:'Variable refrigerant flow systems connect multiple indoor units within a designed network. A project option that needs a detailed site and usage assessment.', spaces:'Multi-room offices · larger premises · projects', planning:'Zoning, load assessment, piping constraints, controls and service access.', image:'ac-vrf.jpg', label:'VARIABLE REFRIGERANT FLOW', name:'a VRF system', need:'Commercial cooling / project'}
  };
  const tabs = Array.from(document.querySelectorAll('[data-system]'));
  const panel = document.getElementById('system-panel');
  const selectSystem = tab => {
    const system = systems[tab.dataset.system];
    tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tab.id);
    document.getElementById('system-category').textContent = system.category;
    const title = document.getElementById('system-title');
    const emphasis = document.createElement('em'); emphasis.textContent = system.accent;
    title.replaceChildren(document.createTextNode(system.title), document.createElement('br'), emphasis);
    document.getElementById('system-description').textContent = system.description;
    document.getElementById('system-spaces').textContent = system.spaces;
    document.getElementById('system-planning').textContent = system.planning;
    const image = document.getElementById('system-image');
    image.src = system.image; image.alt = system.label.toLowerCase() + ' system reference';
    document.getElementById('system-image-label').textContent = system.label;
    const cta = document.getElementById('system-cta');
    const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
    cta.replaceChildren(document.createTextNode('Discuss ' + system.name + ' '), arrow);
    cta.dataset.need = system.need; cta.dataset.detail = 'I would like to discuss ' + system.name + '.';
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectSystem(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectSystem(tabs[next]); tabs[next].focus({preventScroll:true});
      if (matchMedia('(max-width:600px)').matches) tabs[next].scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
    });
    tab.disabled = false;
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { document.body.classList.toggle('enquiry-in-view', entries[0].isIntersecting); });
    observer.observe(form);
  } else {
    // Prefer unobstructed form controls when visibility detection is unavailable.
    document.querySelector('.mobile-contact').hidden = true;
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('.motion-toggle');
  let paused = reducedMotion.matches;
  const syncMotion = () => {
    document.documentElement.classList.toggle('motion-paused', paused || reducedMotion.matches);
    motionButton.hidden = reducedMotion.matches;
    motionButton.setAttribute('aria-pressed', String(paused));
    const icon = document.createElement('span'); icon.setAttribute('aria-hidden','true'); icon.textContent = paused ? '▷' : 'Ⅱ';
    motionButton.replaceChildren(document.createTextNode(paused ? 'Resume motion ' : 'Pause motion '), icon);
  };
  motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reducedMotion.addEventListener('change', syncMotion);
  syncMotion();
  document.getElementById('year').textContent = new Date().getFullYear();

  const legacy = {about:'approach',products:'find-fit',amc:'enquiry',contact:'enquiry',faq:'questions',brands:'solutions',whycrs:'approach',savings:'questions',installation:'approach',reviews:'approach',services:'solutions'};
  const target = legacy[location.hash.slice(1)];
  if (target) { history.replaceState(null, '', location.pathname + location.search + '#' + target); document.getElementById(target).scrollIntoView({behavior:'instant'}); }
})();
