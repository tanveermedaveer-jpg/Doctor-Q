const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

const state = {
  activeFilter: 'all',
  menuOpen: false,
  selectedDoctor: null,
  specialtiesExpanded: false,
  areasExpanded: false,
  doctors: [],
  adminDoctors: [],
  loadingDoctors: false,
  activeAuthRole: 'Patient',
  authMode: 'signin',
  currentUser: null,
  appointments: [],
  editingDoctorId: null,
};

const homepageSections = [
  '.hero',
  '.areas-section',
  '.specialties',
  '.about-section',
  '.stats-section',
  '.featured-doctors',
  '.contact-section',
  '.blog-section',
  '.testimonials-section',
  '.emergency-footer',
];
const dashboardIds = ['admin-dashboard', 'doctor-dashboard', 'patient-dashboard'];
const ADMIN_EMAIL = 'muhammadsadaf010@gmail.com';
const ADMIN_PASSWORD = 'Sadaf@9099';

const setupMobileSplash = () => {
  const splash = document.getElementById('mobile-splash-screen');
  if (!splash || !window.matchMedia('(max-width: 767px)').matches) return;
  window.setTimeout(() => {
    splash.classList.add('is-hidden');
  }, 2000);
};

const updateAuthenticatedNavigation = (user = null) => {
  const navActions = document.querySelector('.nav-actions');
  const mainNav = document.querySelector('.main-nav');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!navActions || !mainNav) return;

  if (user) {
    const dashboardId = `${String(user.role || 'Patient').toLowerCase()}-dashboard`;
    mainNav.innerHTML = `<a href="#${dashboardId}" data-scroll-target="${dashboardId}">Dashboard</a>`;
    navActions.innerHTML = `
      <button class="btn btn-primary dashboard-nav-btn" type="button" data-scroll-target="${dashboardId}">Dashboard</button>
      <button class="btn btn-ghost sign-out-btn" type="button">Sign Out</button>
    `;
    navActions.querySelector('.sign-out-btn')?.addEventListener('click', signOut);
    if (mobileMenu) mobileMenu.innerHTML = `<a href="#${dashboardId}" data-scroll-target="${dashboardId}">Dashboard</a><button type="button" class="mobile-sign-out">Sign Out</button>`;
    mobileMenu?.querySelector('.mobile-sign-out')?.addEventListener('click', signOut);
    setupNavigation();
    return;
  }

  mainNav.innerHTML = `
    <details class="nav-dropdown">
      <summary>Home <span aria-hidden="true">⌄</span></summary>
      <div class="nav-dropdown-menu">
        <a href="#top" data-scroll-target="top">Overview</a>
        <a href="#about-section" data-scroll-target="about-section">About Doctor Q</a>
        <a href="#contact-section" data-scroll-target="contact-section">Contact us</a>
      </div>
    </details>
    <a href="#specialty-section" data-scroll-target="specialty-section">Services</a>
    <a href="#about-section" data-scroll-target="about-section">About</a>
    <a href="#doctor-listings" data-scroll-target="doctor-listings">Team</a>
    <a href="#contact-section" data-scroll-target="contact-section">Contact Us</a>
    <a href="#blog-section" data-scroll-target="blog-section">Blog</a>
  `;
  navActions.innerHTML = '<button class="btn btn-ghost sign-in-btn" type="button" data-modal-target="signin-modal">Sign In</button><button class="btn btn-primary nav-book-btn" type="button" data-scroll-target="doctor-listings">Appointment</button>';
  if (mobileMenu) mobileMenu.innerHTML = '<details class="mobile-nav-dropdown"><summary>Home <span aria-hidden="true">⌄</span></summary><a href="#top" data-scroll-target="top">Overview</a><a href="#about-section" data-scroll-target="about-section">About Doctor Q</a><a href="#contact-section" data-scroll-target="contact-section">Contact Us</a></details><a href="#specialty-section" data-scroll-target="specialty-section">Services</a><a href="#about-section" data-scroll-target="about-section">About</a><a href="#doctor-listings" data-scroll-target="doctor-listings">Team</a><a href="#blog-section" data-scroll-target="blog-section">Blog</a><a href="#contact-section" data-scroll-target="contact-section">Contact Us</a>';
  setupNavigation();
};

const showDashboard = (role, user = state.currentUser) => {
  state.currentUser = user;
  homepageSections.forEach((selector) => document.querySelector(selector)?.classList.add('hidden'));
  dashboardIds.forEach((id) => {
    const dashboard = document.getElementById(id);
    const active = id === `${String(role).toLowerCase()}-dashboard`;
    dashboard?.classList.toggle('hidden', !active);
    dashboard?.setAttribute('aria-hidden', String(!active));
  });
  updateAuthenticatedNavigation(user);
  if (role === 'Admin') loadAdminDashboard();
  if (role === 'Doctor') loadDoctorDashboard();
  if (role === 'Patient') loadPatientDashboard();
  scrollToSection(`${String(role).toLowerCase()}-dashboard`);
};

const enterAdminDashboard = (user = state.currentUser) => {
  localStorage.setItem('doctorQDashboard', 'Admin');
  showDashboard('Admin', user || { name: 'Super Admin', role: 'Admin', email: ADMIN_EMAIL });
};

function signOut() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('doctorQToken');
  localStorage.removeItem('doctorQUser');
  localStorage.removeItem('doctorQDashboard');
  state.currentUser = null;
  homepageSections.forEach((selector) => document.querySelector(selector)?.classList.remove('hidden'));
  dashboardIds.forEach((id) => document.getElementById(id)?.classList.add('hidden'));
  updateAuthenticatedNavigation(null);
  scrollToSection('top');
  showToast('Signed out successfully.');
}

const exitAdminDashboard = signOut;

const setupAreasToggle = () => {
  const areaGrid = document.querySelector('.area-grid');
  const viewAllButton = document.getElementById('view-all-areas');
  viewAllButton?.addEventListener('click', () => {
    state.areasExpanded = !state.areasExpanded;
    areaGrid?.classList.toggle('areas-expanded', state.areasExpanded);
    viewAllButton.textContent = state.areasExpanded ? 'Show Fewer Areas' : 'View All Areas';
  });
};

const setupAboutTabs = () => {
  const tabs = document.querySelectorAll('[data-about-tab]');
  const panels = document.querySelectorAll('.about-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const selected = tab.dataset.aboutTab;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      panels.forEach((panel) => {
        const active = panel.id === `about-panel-${selected}`;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
    });
  });
};

const setupContactForm = () => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Message sent ✓';
    }
    showToast('Thanks for reaching out. Our team will be in touch soon.');
    window.setTimeout(() => {
      form.reset();
      if (button) {
        button.disabled = false;
        button.innerHTML = 'Send message <span aria-hidden="true">→</span>';
      }
    }, 1800);
  });
};

const setupTestimonials = () => {
  const carousel = document.getElementById('testimonial-carousel');
  if (!carousel) return;
  const slides = Array.from(carousel.querySelectorAll('.testimonial-slide'));
  const dots = Array.from(document.querySelectorAll('.carousel-dots [data-slide]'));
  if (!slides.length) return;
  let current = 0;

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === current));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === current));
  };

  carousel.querySelector('.carousel-prev')?.addEventListener('click', () => showSlide(current - 1));
  carousel.querySelector('.carousel-next')?.addEventListener('click', () => showSlide(current + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => showSlide(Number(dot.dataset.slide))));
  window.setInterval(() => showSlide(current + 1), 7000);
};

const setupPasswordToggles = () => {
  document.querySelectorAll('.password-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.closest('.password-input')?.querySelector('input');
      if (!input) return;
      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      button.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
      button.setAttribute('aria-pressed', String(!isVisible));
      button.classList.toggle('is-visible', !isVisible);
    });
  });
};

const specialtyCatalog = [
  { name: 'Cardiology', category: 'cardiologists', icon: '💙', description: 'Heart Care' },
  { name: 'Pediatrics', category: 'pediatricians', icon: '🧒', description: 'Child Specialist' },
  { name: 'Gynecology', category: 'gynecologists', icon: '🩺', description: 'Women’s Health' },
  { name: 'Orthopedics', category: 'orthopedics', icon: '🦴', description: 'Bone & Joints' },
  { name: 'Dermatology', category: 'dermatologists', icon: '✨', description: 'Skin Care' },
  { name: 'Ophthalmology', category: 'ophthalmology', icon: '👁️', description: 'Eye Care' },
  { name: 'Neurology', category: 'neurology', icon: '🧠', description: 'Brain & Spine' },
  { name: 'General Medicine', category: 'general-medicine', icon: '🩺', description: 'Physician' },
  { name: 'ENT', category: 'ent', icon: '👂', description: 'Ear, Nose & Throat' },
  { name: 'Dental Care', category: 'dental-care', icon: '🦷', description: 'Smile & Gum Care' },
  { name: 'Urology', category: 'urology', icon: '💧', description: 'Kidney & Urinary' },
  { name: 'Endocrinology', category: 'endocrinology', icon: '⚕️', description: 'Hormones' },
  { name: 'Gastroenterology', category: 'gastroenterology', icon: '🧬', description: 'Digestive Care' },
  { name: 'Psychiatry', category: 'psychiatry', icon: '🧠', description: 'Mental Wellness' },
  { name: 'Pulmonology', category: 'pulmonology', icon: '🫁', description: 'Lungs & Breathing' },
  { name: 'Oncology', category: 'oncology', icon: '🩸', description: 'Cancer Care' },
];

const normalize = (value) => String(value || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

const specialtyAliases = {
  cardiology: 'cardiologist',
  cardiologist: 'cardiologist',
  pediatrics: 'pediatrician',
  pediatrician: 'pediatrician',
  'child specialist': 'pediatrician',
  gynecology: 'gynecologist',
  gynecologist: 'gynecologist',
  orthopedics: 'orthopedic surgeon',
  orthopedic: 'orthopedic surgeon',
  'orthopedic surgeon': 'orthopedic surgeon',
  'general physician': 'general medicine',
  'general medicine': 'general medicine',
  physician: 'general medicine',
  dermatology: 'dermatology',
  ophthalmology: 'ophthalmology',
  neurology: 'neurology',
  ent: 'ent',
  'dental care': 'dental care',
  urology: 'urology',
  endocrinology: 'endocrinology',
  gastroenterology: 'gastroenterology',
  psychiatry: 'psychiatry',
  pulmonology: 'pulmonology',
  oncology: 'oncology',
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const counters = document.querySelectorAll('[data-target]');

const animateCounter = (counter) => {
  const target = Number(counter.dataset.target || 0);
  const duration = 1400;
  let start = null;

  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const value = Math.floor(progress * target);
    counter.textContent = value.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      counter.textContent = target.toLocaleString();
    }

  };

  requestAnimationFrame(step);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const toast = document.getElementById('app-toast');

const showToast = (message, type = 'success') => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('show', 'error');
  if (type === 'error') toast.classList.add('error');
  toast.classList.add('show');

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
};

const updateAuthRoleUI = () => {
  document.querySelectorAll('.auth-role-tab').forEach((tab) => {
    const isActive = tab.dataset.role === state.activeAuthRole;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });

  const portalLabel = document.getElementById('auth-portal-label');
  if (portalLabel) {
    const portalText = state.activeAuthRole === 'Admin' ? 'Secure admin portal' : state.activeAuthRole === 'Doctor' ? 'Secure doctor portal' : 'Secure patient portal';
    portalLabel.textContent = portalText;
  }

  const modeToggle = document.getElementById('auth-mode-toggle');
  const switchRow = document.querySelector('.auth-switch-row');
  const signupAllowed = state.activeAuthRole === 'Patient';
  if (!signupAllowed && state.authMode === 'signup') {
    state.authMode = 'signin';
    updateAuthFormMode();
    return;
  }
  if (modeToggle) modeToggle.hidden = !signupAllowed;
  if (switchRow) switchRow.hidden = !signupAllowed;
  if (!signupAllowed && portalLabel) {
    portalLabel.textContent = state.activeAuthRole === 'Doctor' ? 'Doctor credentials are issued by Admin' : 'Secure admin portal';
  }
};

const updateAuthFormMode = () => {
  const isSignup = state.authMode === 'signup' && state.activeAuthRole === 'Patient';
  const submitButton = document.getElementById('auth-submit-btn');
  const modeToggle = document.getElementById('auth-mode-toggle');
  const title = document.getElementById('signin-title');

  document.querySelectorAll('.auth-field-signup').forEach((field) => {
    field.classList.toggle('hidden', !isSignup);
    const input = field.querySelector('input');
    if (input) {
      input.required = isSignup;
    }
  });

  if (submitButton) {
    submitButton.textContent = isSignup ? 'Create Account' : 'Sign In';
  }

  if (modeToggle) {
    modeToggle.textContent = isSignup ? 'Sign In' : 'Sign Up';
  }

  if (title) {
    title.textContent = isSignup ? 'Sign Up' : 'Sign In';
  }

  const switchText = document.querySelector('.auth-switch-text');
  if (switchText) {
    switchText.textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
  }

  updateAuthRoleUI();
};

const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const openModalById = (id) => {
  const modal = document.getElementById(id);
  if (!modal) return;

  if (id === 'signin-modal') {
    state.authMode = 'signin';
    state.activeAuthRole = 'Patient';
    updateAuthFormMode();
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
};

const closeModalById = (id) => {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
};

const setFilterSelection = (filterValue) => {
  const filterButtons = document.querySelectorAll('.filter-tab');
  filterButtons.forEach((tab) => tab.classList.toggle('active', tab.dataset.filter === filterValue));
};

const renderSpecialties = () => {
  const specialtyGrid = document.getElementById('specialty-grid');
  if (!specialtyGrid) return;

  const extraCards = specialtyGrid.querySelectorAll('.specialty-card.extra-card');
  extraCards.forEach((card) => card.remove());

  if (state.specialtiesExpanded) {
    specialtyCatalog.slice(8).forEach((specialty) => {
      const article = document.createElement('article');
      article.className = 'specialty-card reveal extra-card';
      article.dataset.specialtyName = specialty.name;
      article.innerHTML = `
        <div class="card-topline">
          <div class="icon-wrap ${specialty.category}">
            <span>${specialty.icon}</span>
          </div>
          <span class="status-tag">12+ Doctors</span>
        </div>
        <h3>${specialty.name}</h3>
        <p>${specialty.description}</p>
        <button type="button" class="specialty-view-btn" data-specialty-name="${specialty.name}">View Doctors <span aria-hidden="true">→</span></button>
      `;
      specialtyGrid.appendChild(article);
    });
  }

  const allSpecialtiesList = document.getElementById('all-specialties-list');
  if (allSpecialtiesList) {
    allSpecialtiesList.innerHTML = specialtyCatalog
      .map(
        (specialty) => `
          <div class="specialty-tag-item">
            <span>${specialty.icon} ${specialty.name}</span>
            <button type="button" data-specialty-name="${specialty.name}">View</button>
          </div>
        `
      )
      .join('');

    allSpecialtiesList.querySelectorAll('button[data-specialty-name]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const specialtyName = button.dataset.specialtyName;
        const input = document.getElementById('specialty-search');
        if (input) input.value = specialtyName;
        state.activeFilter = 'all';
        setFilterSelection('all');
        closeModalById('specialties-modal');
        searchDoctors(specialtyName, document.getElementById('area-search')?.value || '');
        scrollToSection('doctor-listings');
      });
    });
  }

  specialtyGrid.querySelectorAll('.specialty-view-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const specialtyName = button.dataset.specialtyName;
      const input = document.getElementById('specialty-search');
      if (input) input.value = specialtyName;
      state.activeFilter = 'all';
      setFilterSelection('all');
      searchDoctors(specialtyName, document.getElementById('area-search')?.value || '');
      scrollToSection('doctor-listings');
    });
  });

  const viewAllButton = document.getElementById('view-all-specialties');
  if (viewAllButton) {
    viewAllButton.textContent = state.specialtiesExpanded ? 'Show Less' : 'View All Specialties';
    viewAllButton.setAttribute('aria-expanded', String(state.specialtiesExpanded));
  }

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
};

const deriveDoctorCategory = (specialty, fallbackCategory = 'all') => {
  const key = normalize(specialty || fallbackCategory || 'all');
  const categoryMap = {
    cardiology: 'cardiologists',
    cardiologist: 'cardiologists',
    pediatrics: 'pediatricians',
    pediatrician: 'pediatricians',
    gynecology: 'gynecologists',
    gynecologist: 'gynecologists',
    orthopedics: 'orthopedics',
    orthopedic: 'orthopedics',
    'orthopedic surgeon': 'orthopedics',
    dermatology: 'dermatologists',
    ophthalmology: 'ophthalmology',
    neurology: 'neurology',
    'general medicine': 'general-medicine',
    physician: 'general-medicine',
    ent: 'ent',
    'dental care': 'dental-care',
    urology: 'urology',
    endocrinology: 'endocrinology',
    gastroenterology: 'gastroenterology',
    psychiatry: 'psychiatry',
    pulmonology: 'pulmonology',
    oncology: 'oncology',
  };

  return categoryMap[key] || fallbackCategory || 'all';
};

const normalizeDoctorPayload = (doctor = {}) => {
  const doctorName =
    doctor.name ||
    [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') ||
    [doctor.fullName, doctor.displayName].filter(Boolean)[0] ||
    'Doctor';

  const specialty =
    doctor.specialty ||
    doctor.specialization ||
    doctor.specialist ||
    doctor.department ||
    'General Medicine';

  const clinic = doctor.clinic || doctor.hospital || doctor.clinicName || doctor.location || doctor.area || 'D.I. Khan';
  const area = doctor.area || doctor.location || doctor.hospital || doctor.city || 'D.I. Khan';
  const feeValue = Number(doctor.fee ?? doctor.consultationFee ?? doctor.price ?? doctor.visitFee ?? 0);
  const ratingValue = Number(doctor.rating ?? doctor.averageRating ?? 4.8);

  return {
    id: doctor.id || doctor._id || doctor.doctorId || doctorName,
    name: doctorName,
    email: doctor.email || '',
    phone: doctor.phone || '',
    userId: doctor.userId || '',
    specialty,
    category: deriveDoctorCategory(specialty, doctor.category || doctor.categoryName || 'all'),
    clinic,
    area,
    fee: feeValue,
    qualification: doctor.qualification || doctor.qualifications || doctor.degree || 'MBBS',
    timings: doctor.timings || doctor.timing || doctor.schedule || doctor.availableTime || 'Flexible',
    webhookUrl: doctor.webhookUrl || doctor.googleSheetWebhookUrl || doctor.webhook || '',
    rating: ratingValue,
    image:
      doctor.image ||
      doctor.photo ||
      doctor.avatar ||
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80',
    bio:
      doctor.bio ||
      doctor.description ||
      'Experienced healthcare professional committed to delivering patient-focused, compassionate care.',
    reviews:
      doctor.reviews ||
      doctor.review ||
      'Highly rated for clear communication, thoughtful care, and healthy treatment outcomes.',
    active: doctor.active !== false,
  };
};

const extractDoctorList = (payload) => {
  if (Array.isArray(payload)) return payload.map(normalizeDoctorPayload);
  if (Array.isArray(payload.doctors)) return payload.doctors.map(normalizeDoctorPayload);
  if (Array.isArray(payload.data)) return payload.data.map(normalizeDoctorPayload);
  if (Array.isArray(payload.results)) return payload.results.map(normalizeDoctorPayload);
  if (Array.isArray(payload.items)) return payload.items.map(normalizeDoctorPayload);
  return [];
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const updateDoctorDatalists = () => {
  const specialties = [...new Set([
    ...specialtyCatalog.map((item) => item.name),
    ...state.doctors.map((doctor) => doctor.specialty),
    ...state.adminDoctors.map((doctor) => doctor.specialty),
  ].filter(Boolean))];
  const areas = [...new Set([
    ...Array.from(document.querySelectorAll('#area-options option')).map((option) => option.value),
    ...state.doctors.map((doctor) => doctor.area),
    ...state.adminDoctors.map((doctor) => doctor.area || doctor.clinic),
  ].filter(Boolean))];
  ['specialty-options', 'admin-specialty-options', 'edit-specialty-options'].forEach((id) => {
    const list = document.getElementById(id);
    if (list) list.innerHTML = specialties.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
  });
  ['area-options', 'admin-area-options', 'edit-area-options'].forEach((id) => {
    const list = document.getElementById(id);
    if (list) list.innerHTML = areas.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
  });
};

const readImageFile = (file) => new Promise((resolve, reject) => {
  if (!file || !file.size) {
    resolve('');
    return;
  }
  if (!file.type.startsWith('image/')) {
    reject(new Error('Please select a valid image file.'));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Unable to read the selected image.'));
  reader.readAsDataURL(file);
});

const setDoctorLoadingState = (isLoading) => {
  state.loadingDoctors = isLoading;
  const doctorGrid = document.querySelector('.doctor-grid');
  if (!doctorGrid) return;

  if (isLoading) {
    doctorGrid.innerHTML = `
      <div class="doctor-state-message" aria-live="polite">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>Loading top doctors...</p>
      </div>
    `;
    return;
  }

  if (!state.doctors.length) {
    doctorGrid.innerHTML = `
      <div class="doctor-state-message">
        <p>No doctors are available at the moment.</p>
        <small>Try searching another specialty or area.</small>
      </div>
    `;
  }
};

const renderDoctorCards = (doctorList = state.doctors) => {
  const doctorGrid = document.querySelector('.doctor-grid');
  if (!doctorGrid) return;

  if (state.loadingDoctors) {
    setDoctorLoadingState(true);
    return;
  }

  const visibleDoctors = doctorList.filter((doctor) => doctor.active !== false);
  if (!visibleDoctors.length) {
    doctorGrid.innerHTML = `
      <div class="doctor-state-message">
        <p>No doctors match the current search.</p>
        <small>Try a different specialty, area, or hospital name.</small>
      </div>
    `;
    return;
  }

  doctorGrid.innerHTML = visibleDoctors
    .map(
      (doctor) => `
        <article class="doctor-card reveal" data-doctor-id="${escapeHtml(doctor.id)}" data-category="${escapeHtml(doctor.category)}" data-doctor-name="${escapeHtml(doctor.name)}" data-specialty="${escapeHtml(doctor.specialty)}" data-clinic="${escapeHtml(doctor.clinic)}" data-area="${escapeHtml(doctor.area)}" data-fee="${escapeHtml(doctor.fee)}" data-image="${escapeHtml(doctor.image)}">
          <div class="doctor-image-wrap">
            <img src="${escapeHtml(doctor.image)}" alt="${escapeHtml(doctor.name)}" />
            <span class="availability-badge">Available Today</span>
          </div>
          <div class="doctor-body">
            <div class="doctor-mainline">
              <div>
                <h3>${escapeHtml(doctor.name)}</h3>
                <p>${escapeHtml(doctor.qualification)}</p>
              </div>
              <span class="rating">${Number(doctor.rating).toFixed(1)} ★</span>
            </div>
            <p class="specialty">${escapeHtml(doctor.specialty)}</p>
            <div class="meta-row">
              <span>📍 ${escapeHtml(doctor.clinic)}</span>
            </div>
            <div class="meta-row">
              <span>🕒 ${escapeHtml(doctor.timings)}</span>
            </div>
            <div class="card-footer">
              <strong>PKR ${Number(doctor.fee).toLocaleString()}</strong>
              <div class="cta-actions">
                <button type="button" class="btn btn-primary small-btn book-btn" data-doctor-id="${escapeHtml(doctor.id)}">Book Appointment</button>
                <button type="button" class="view-profile-btn" data-doctor-id="${escapeHtml(doctor.id)}">View Profile</button>
              </div>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
};

const applyDoctorFilters = () => {
  const specialtyInput = document.getElementById('specialty-search');
  const areaInput = document.getElementById('area-search');
  const specialtyValue = normalize(specialtyInput ? specialtyInput.value : '');
  const areaValue = normalize(areaInput ? areaInput.value : '');

  const filteredDoctors = state.doctors.filter((doctor) => {
    const matchesFilter = state.activeFilter === 'all' || doctor.category === state.activeFilter;
    const cardSpecialty = normalize(doctor.specialty || '');
    const cardArea = normalize(doctor.area || '');
    const cardClinic = normalize(doctor.clinic || '');
    const matchesSpecialty =
      !specialtyValue ||
      cardSpecialty.includes(specialtyValue) ||
      specialtyValue.includes(cardSpecialty) ||
      cardSpecialty.includes(specialtyAliases[specialtyValue] || specialtyValue) ||
      (specialtyAliases[specialtyValue] || specialtyValue).includes(cardSpecialty);
    const matchesArea = !areaValue || cardArea.includes(areaValue) || cardClinic.includes(areaValue) || areaValue.includes(cardArea);

    return matchesFilter && matchesSpecialty && matchesArea;
  });

  renderDoctorCards(filteredDoctors);
};

const getDoctorByName = (doctorName) => {
  if (!doctorName) return null;
  const searchValue = String(doctorName).trim();
  return state.doctors.find(
    (doctor) =>
      doctor.name === searchValue ||
      doctor.id === searchValue ||
      String(doctor.id) === searchValue ||
      `${doctor.name}` === searchValue
  );
};

const setBookingModalDoctor = (doctorRef) => {
  const profile = typeof doctorRef === 'string' ? getDoctorByName(doctorRef) : doctorRef;
  if (!profile) return;

  state.selectedDoctor = profile;
  const bookingTitle = document.getElementById('booking-title');
  const bookingSpecialty = document.getElementById('booking-specialty');
  const bookingClinic = document.getElementById('booking-clinic');
  const bookingFee = document.getElementById('booking-fee');
  const modalImage = document.getElementById('modal-doctor-image');

  if (bookingTitle) bookingTitle.textContent = profile.name;
  if (bookingSpecialty) bookingSpecialty.textContent = profile.specialty;
  if (bookingClinic) bookingClinic.textContent = profile.clinic;
  if (bookingFee) bookingFee.textContent = Number(profile.fee).toLocaleString();
  if (modalImage) modalImage.src = profile.image;
};

const openDoctorProfile = (doctorRef) => {
  const profile = typeof doctorRef === 'string' ? getDoctorByName(doctorRef) : doctorRef;
  if (!profile) return;

  state.selectedDoctor = profile;

  const profileName = document.getElementById('doctor-profile-name');
  const profileSpecialty = document.getElementById('doctor-profile-specialty');
  const profileLocation = document.getElementById('doctor-profile-location');
  const profileQualifications = document.getElementById('doctor-profile-qualifications');
  const profileFee = document.getElementById('doctor-profile-fee');
  const profileTimings = document.getElementById('doctor-profile-timings');
  const profileRating = document.getElementById('doctor-profile-rating');
  const profileBio = document.getElementById('doctor-profile-bio');
  const profileReviews = document.getElementById('doctor-profile-reviews');
  const profileImage = document.getElementById('doctor-profile-image');
  const profileSummary = document.getElementById('doctor-profile-summary');

  if (profileName) profileName.textContent = profile.name;
  if (profileSpecialty) profileSpecialty.textContent = profile.specialty;
  if (profileLocation) profileLocation.textContent = profile.clinic;
  if (profileQualifications) profileQualifications.textContent = profile.qualification;
  if (profileFee) profileFee.textContent = `PKR ${Number(profile.fee).toLocaleString()}`;
  if (profileTimings) profileTimings.textContent = profile.timings;
  if (profileRating) profileRating.textContent = `${Number(profile.rating).toFixed(1)}/5`;
  if (profileBio) profileBio.textContent = profile.bio;
  if (profileReviews) profileReviews.textContent = profile.reviews;
  if (profileImage) profileImage.src = profile.image;
  if (profileSummary) profileSummary.textContent = `${profile.name} is available in ${profile.area}`;

  openModalById('doctor-details-modal');
};

const fetchDoctors = async (params = {}) => {
  const url = new URL(`${API_BASE_URL}/doctors`);
  if (params.specialty) url.searchParams.set('specialty', params.specialty);
  if (params.area) url.searchParams.set('area', params.area);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load doctors right now.');
  }

  const payload = await response.json().catch(() => ({}));
  const doctors = extractDoctorList(payload);
  state.doctors = doctors.filter((doctor) => doctor.active !== false);
  updateDoctorDatalists();

  if (!state.doctors.length) {
    showToast('No doctors found for the selected filters.', 'error');
  }

  applyDoctorFilters();
};

const searchDoctors = async (specialtyValue = '', areaValue = '') => {
  const cleanedSpecialty = String(specialtyValue || '').trim();
  const cleanedArea = String(areaValue || '').trim();

  if (!cleanedSpecialty && !cleanedArea) {
    await fetchDoctors();
    return;
  }

  const url = new URL(`${API_BASE_URL}/doctors/search`);
  if (cleanedSpecialty) url.searchParams.set('specialty', cleanedSpecialty);
  if (cleanedArea) url.searchParams.set('area', cleanedArea);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Doctor search failed.');
    }

    const payload = await response.json().catch(() => ({}));
    const doctors = extractDoctorList(payload);
    state.doctors = doctors.filter((doctor) => doctor.active !== false);
    updateDoctorDatalists();
    applyDoctorFilters();
    if (!doctors.length) {
      showToast('No doctors match this search.', 'error');
    }
  } catch (error) {
    showToast(error.message || 'Unable to search doctors.', 'error');
  }
};

const getStored = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
};

const setStored = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const apiRequest = async (path, options = {}) => {
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const token = localStorage.getItem('doctorQToken');
  if (token && token !== 'true') headers.Authorization = 'Bearer ' + token;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Request failed.');
  return payload;
};

const localAppointments = () => getStored('doctorQAppointments', []);
const saveAppointments = (appointments) => {
  state.appointments = appointments;
  setStored('doctorQAppointments', appointments);
};

const appointmentDate = (appointment) => [appointment.date || appointment.preferredDate, appointment.timeSlot].filter(Boolean).join(' · ') || 'Not scheduled';
const statusBadge = (status) => `<span class="status-badge status-${String(status || 'Pending').toLowerCase()}">${status || 'Pending'}</span>`;

const loadAppointments = async (query = '') => {
  try {
    const result = await apiRequest(`/appointments${query}`);
    const list = Array.isArray(result) ? result : result.appointments || result.data || [];
    state.appointments = list;
    saveAppointments(list);
    return list;
  } catch (error) {
    const list = localAppointments();
    state.appointments = list;
    return list;
  }
};

const renderAdminDoctors = () => {
  const body = document.querySelector('#doctors-table tbody');
  if (!body) return;
  const doctors = state.adminDoctors.length ? state.adminDoctors : getStored('doctorQDoctors', []);
  body.innerHTML = doctors.length ? doctors.map((doctor) => `
    <tr data-doctor-id="${escapeHtml(doctor.id)}">
      <td><strong>${escapeHtml(doctor.name)}</strong><small>${escapeHtml(doctor.email || '—')}</small></td>
      <td>${escapeHtml(doctor.specialty)}</td><td>${escapeHtml(doctor.clinic || doctor.hospital || 'D.I. Khan')}</td>
      <td>${statusBadge(doctor.active === false ? 'Inactive' : 'Active')}</td>
      <td>${doctor.email ? `<button class="table-link copy-credential" type="button" data-copy="${escapeHtml(doctor.email)}">Copy email</button>` : 'Generated on add'}</td>
      <td class="table-actions"><button type="button" class="table-link edit-doctor" data-id="${escapeHtml(doctor.id)}">Edit</button><button type="button" class="table-link toggle-doctor" data-id="${escapeHtml(doctor.id)}">${doctor.active === false ? 'Activate' : 'Deactivate'}</button><button type="button" class="table-link danger delete-doctor" data-id="${escapeHtml(doctor.id)}">Delete</button></td>
    </tr>`).join('') : '<tr><td colspan="6">No doctors found.</td></tr>';
};

const renderAppointmentsTable = (selector, appointments, role) => {
  const body = document.querySelector(`${selector} tbody`);
  if (!body) return;
  if (!appointments.length) {
    body.innerHTML = '<tr><td colspan="5">No appointments yet.</td></tr>';
    return;
  }
  body.innerHTML = appointments.map((appointment) => {
    const id = appointment.id || appointment._id || '';
    const action = role === 'patient'
      ? `<button type="button" class="table-link cancel-appointment" data-id="${id}">Cancel</button>`
      : `<select class="status-select" data-id="${id}"><option ${appointment.status === 'Pending' ? 'selected' : ''}>Pending</option><option ${appointment.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option><option ${appointment.status === 'Completed' ? 'selected' : ''}>Completed</option><option ${appointment.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option><option ${appointment.status === 'Rejected' ? 'selected' : ''}>Rejected</option></select>`;
    if (role === 'admin') {
      return `<tr><td><strong>${appointment.patientName}</strong><small>${appointment.patientPhone || ''}</small></td><td>${appointment.doctorName}</td><td>${appointmentDate(appointment)}</td><td>${statusBadge(appointment.status)}</td><td>${action}</td></tr>`;
    }
    if (role === 'doctor') {
      return `<tr><td><strong>${appointment.patientName}</strong></td><td>${appointmentDate(appointment)}</td><td>${appointment.patientPhone || appointment.patientEmail || '—'}</td><td>${statusBadge(appointment.status)}</td><td>${action}</td></tr>`;
    }
    return `<tr><td>${appointment.doctorName}</td><td>${appointmentDate(appointment)}</td><td>${appointment.specialty || '—'}</td><td>${statusBadge(appointment.status)}</td><td>${action}</td></tr>`;
  }).join('');
};

const loadAdminDashboard = async () => {
  try {
    const payload = await apiRequest('/doctors?includeInactive=true');
    state.adminDoctors = extractDoctorList(payload);
    state.doctors = state.adminDoctors.filter((doctor) => doctor.active !== false);
    setStored('doctorQDoctors', state.adminDoctors);
  } catch (error) {
    state.adminDoctors = getStored('doctorQDoctors', state.adminDoctors);
    state.doctors = state.adminDoctors.filter((doctor) => doctor.active !== false);
  }
  updateDoctorDatalists();
  applyDoctorFilters();
  renderAdminDoctors();
  const appointments = await loadAppointments();
  renderAppointmentsTable('#admin-appointments-table', appointments, 'admin');
  const count = document.getElementById('admin-doctor-count');
  const patients = document.getElementById('admin-patient-count');
  const pending = document.getElementById('admin-pending-count');
  if (count) count.textContent = state.adminDoctors.length;
  if (patients) patients.textContent = getStored('doctorQUsers', []).filter((user) => user.role === 'Patient').length;
  if (pending) pending.textContent = appointments.filter((item) => String(item.status).toLowerCase() === 'pending').length;
  try {
    const stats = await apiRequest('/admin/stats');
    if (count) count.textContent = stats.doctors;
    if (patients) patients.textContent = stats.patients;
    if (pending) pending.textContent = stats.pendingAppointments;
  } catch (error) {}
};

const loadDoctorDashboard = async () => {
  const user = state.currentUser || {};
  const title = document.getElementById('doctor-dashboard-title');
  if (title) title.textContent = `${user.name || 'Doctor'}'s Dashboard`;
  const appointments = await loadAppointments(`?doctorId=${encodeURIComponent(user.doctorId || user.id || '')}`);
  const doctorAppointments = appointments.filter((item) => !item.id?.toString().startsWith('local-') || String(item.doctorId) === String(user.doctorId || user.id));
  renderAppointmentsTable('#doctor-appointments-table', doctorAppointments, 'doctor');
  renderDoctorPortal(findDoctorForUser(), doctorAppointments);
};

const loadPatientDashboard = async () => {
  const user = state.currentUser || {};
  const title = document.getElementById('patient-dashboard-title');
  if (title) title.textContent = `${user.name || 'Patient'}'s Dashboard`;
  const appointments = await loadAppointments(`?patientEmail=${encodeURIComponent(user.email || '')}`);
  renderAppointmentsTable('#patient-appointments-table', appointments.filter((item) => String(item.patientEmail || '').toLowerCase() === String(user.email || '').toLowerCase() || String(item.patientId) === String(user.id)), 'patient');
};

const findDoctorForUser = () => {
  const user = state.currentUser || {};
  return [...state.adminDoctors, ...state.doctors].find((doctor) =>
    String(doctor.id) === String(user.doctorId) ||
    String(doctor.userId) === String(user.id) ||
    (doctor.email && user.email && doctor.email.toLowerCase() === user.email.toLowerCase())
  ) || null;
};

const renderDoctorPortal = (doctor, appointments = []) => {
  if (!doctor) return;
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const image = document.getElementById('portal-doctor-image');
  if (image) {
    image.src = doctor.image;
    image.alt = doctor.name;
  }
  setText('portal-doctor-name', doctor.name);
  setText('portal-doctor-specialty', doctor.specialty);
  setText('portal-doctor-timings', doctor.timings);
  setText('portal-doctor-fee', `PKR ${Number(doctor.fee).toLocaleString()}`);
  setText('portal-booked-patients', appointments.length);
  const earnings = appointments
    .filter((appointment) => !['Cancelled', 'Rejected'].includes(appointment.status))
    .reduce((sum) => sum + Number(doctor.fee || 0), 0);
  setText('portal-doctor-earnings', `PKR ${earnings.toLocaleString()}`);
  const status = document.getElementById('portal-doctor-status');
  if (status) {
    status.textContent = doctor.active === false ? 'Inactive' : 'Active';
    status.className = `status-badge ${doctor.active === false ? 'status-cancelled' : 'status-confirmed'}`;
  }
};

const openDoctorEditor = (doctor) => {
  const form = document.getElementById('edit-doctor-form');
  if (!form || !doctor) return;
  state.editingDoctorId = String(doctor.id);
  ['doctorId', 'name', 'specialty', 'hospital', 'fee', 'timing', 'image', 'webhookUrl'].forEach((name) => {
    const input = form.elements[name];
    if (input) input.value = name === 'doctorId' ? doctor.id : name === 'timing' ? doctor.timings : name === 'hospital' ? doctor.clinic : (doctor[name] ?? '');
  });
  const fileInput = form.elements.imageFile;
  if (fileInput) fileInput.value = '';
  const title = document.getElementById('edit-doctor-title');
  if (title) title.textContent = `Edit ${doctor.name}`;
  openModalById('edit-doctor-modal');
};

const setupDoctorEditor = () => {
  const form = document.getElementById('edit-doctor-form');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const doctor = state.adminDoctors.find((item) => String(item.id) === String(state.editingDoctorId)) ||
      state.doctors.find((item) => String(item.id) === String(state.editingDoctorId));
    if (!doctor) return;
    const formData = new FormData(form);
    const imageFile = await readImageFile(formData.get('imageFile')).catch((error) => {
      showToast(error.message, 'error');
      return '';
    });
    if (formData.get('imageFile')?.size && !imageFile) return;
    const changes = {
      name: String(formData.get('name') || '').trim(),
      specialty: String(formData.get('specialty') || '').trim(),
      hospital: String(formData.get('hospital') || '').trim(),
      fee: Number(formData.get('fee') || 0),
      timing: String(formData.get('timing') || '').trim(),
      image: imageFile || String(formData.get('image') || '').trim() || doctor.image,
      webhookUrl: String(formData.get('webhookUrl') || '').trim(),
    };
    try { await apiRequest(`/doctors/${doctor.id}`, { method: 'PUT', body: JSON.stringify(changes) }); } catch (error) {}
    Object.assign(doctor, changes, { clinic: changes.hospital, area: changes.hospital, timings: changes.timing });
    const adminDoctor = state.adminDoctors.find((item) => String(item.id) === String(doctor.id));
    if (adminDoctor && adminDoctor !== doctor) Object.assign(adminDoctor, doctor);
    if (!adminDoctor) state.adminDoctors = [...state.adminDoctors, doctor];
    state.doctors = state.adminDoctors.filter((item) => item.active !== false);
    setStored('doctorQDoctors', state.adminDoctors);
    updateDoctorDatalists();
    renderAdminDoctors();
    applyDoctorFilters();
    closeModalById('edit-doctor-modal');
    showToast('Doctor profile updated.');
    if (state.currentUser?.role === 'Doctor') renderDoctorPortal(doctor, state.appointments);
  });
};

const updateAppointmentStatus = async (id, status) => {
  const appointments = localAppointments().map((item) => String(item.id || item._id) === String(id) ? { ...item, status } : item);
  saveAppointments(appointments);
  try {
    await apiRequest(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  } catch (error) {
    // Local persistence keeps the dashboard usable when the API is unavailable.
  }
  showToast(`Appointment marked ${status.toLowerCase()}.`);
  if (state.currentUser?.role === 'Admin') loadAdminDashboard();
  if (state.currentUser?.role === 'Doctor') loadDoctorDashboard();
};

const setupDashboardActions = () => {
  document.querySelectorAll('.dashboard-home-btn').forEach((button) => button.addEventListener('click', signOut));
  document.querySelector('.edit-own-profile-btn')?.addEventListener('click', () => {
    const doctor = findDoctorForUser();
    if (doctor) openDoctorEditor(doctor);
  });
  document.querySelectorAll('.patient-book-btn').forEach((button) => button.addEventListener('click', () => {
    homepageSections.forEach((selector) => document.querySelector(selector)?.classList.remove('hidden'));
    dashboardIds.forEach((id) => document.getElementById(id)?.classList.add('hidden'));
    scrollToSection('doctor-listings');
  }));
  document.addEventListener('change', (event) => {
    if (event.target.matches('.status-select')) updateAppointmentStatus(event.target.dataset.id, event.target.value);
  });
  document.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('.delete-doctor');
    const editButton = event.target.closest('.edit-doctor');
    const toggleButton = event.target.closest('.toggle-doctor');
    const cancelButton = event.target.closest('.cancel-appointment');
    const copyButton = event.target.closest('.copy-credential');
    if (copyButton) {
      await navigator.clipboard?.writeText(copyButton.dataset.copy);
      showToast('Doctor email copied.');
    }
    if (deleteButton && window.confirm('Delete this doctor and their account?')) {
      try { await apiRequest(`/doctors/${deleteButton.dataset.id}`, { method: 'DELETE' }); } catch (error) {}
      const doctors = state.adminDoctors.filter((doctor) => String(doctor.id) !== String(deleteButton.dataset.id));
      state.adminDoctors = doctors;
      state.doctors = doctors.filter((doctor) => doctor.active !== false);
      setStored('doctorQDoctors', doctors);
      updateDoctorDatalists();
      renderAdminDoctors();
      applyDoctorFilters();
      showToast('Doctor deleted.');
    }
    if (toggleButton) {
      const doctor = state.adminDoctors.find((item) => String(item.id) === String(toggleButton.dataset.id));
      if (!doctor) return;
      const active = doctor.active === false;
      try { await apiRequest(`/doctors/${toggleButton.dataset.id}`, { method: 'PUT', body: JSON.stringify({ active }) }); } catch (error) {}
      doctor.active = active;
      state.doctors = state.adminDoctors.filter((item) => item.active !== false);
      setStored('doctorQDoctors', state.adminDoctors);
      renderAdminDoctors();
      applyDoctorFilters();
      showToast(`${doctor.name} is now ${active ? 'active' : 'inactive'}.`);
    }
    if (editButton) {
      const doctor = state.adminDoctors.find((item) => String(item.id) === String(editButton.dataset.id));
      if (!doctor) return;
      openDoctorEditor(doctor);
    }
    if (cancelButton) updateAppointmentStatus(cancelButton.dataset.id, 'Cancelled');
  });
};

const setupAdminForm = () => {
  const form = document.getElementById('add-doctor-form');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const imageFile = await readImageFile(formData.get('imageFile')).catch((error) => {
      showToast(error.message, 'error');
      return '';
    });
    if (formData.get('imageFile')?.size && !imageFile) return;
    const data = Object.fromEntries(formData.entries());
    delete data.imageFile;
    if (imageFile) data.image = imageFile;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      let doctor;
      let credentials;
      try {
        const result = await apiRequest('/doctors', { method: 'POST', body: JSON.stringify(data) });
        doctor = normalizeDoctorPayload(result.doctor || result);
        credentials = result.credentials;
      } catch (error) {
        const id = `local-${Date.now()}`;
        credentials = { email: data.email || `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@doctorq.pk`, password: data.password || `DQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}!` };
        const user = { id, doctorId: id, name: data.name, email: credentials.email, password: credentials.password, role: 'Doctor' };
        const users = getStored('doctorQUsers', []);
        users.push(user); setStored('doctorQUsers', users);
        doctor = normalizeDoctorPayload({ ...data, id });
      }
      const doctors = getStored('doctorQDoctors', state.adminDoctors);
      doctors.unshift(doctor); setStored('doctorQDoctors', doctors);
      state.adminDoctors = [doctor, ...state.adminDoctors.filter((item) => String(item.id) !== String(doctor.id))];
      state.doctors = state.adminDoctors.filter((item) => item.active !== false);
      updateDoctorDatalists();
      applyDoctorFilters();
      renderAdminDoctors();
      const credentialsBox = document.getElementById('doctor-credentials');
      if (credentialsBox) {
        credentialsBox.classList.remove('hidden');
        credentialsBox.innerHTML = `<strong>Doctor account created</strong><span>Email: <b>${escapeHtml(credentials?.email || doctor.email)}</b></span><span>Temporary password: <b>${escapeHtml(credentials?.password || 'Set by doctor')}</b></span><small>Share these credentials securely with the doctor.</small>`;
      }
      form.reset();
      showToast('Doctor added and credentials generated.');
      loadAdminDashboard();
    } catch (error) {
      showToast(error.message || 'Unable to add doctor.', 'error');
    } finally {
      button.disabled = false;
    }
  });
};

const setupNavigation = () => {
  document.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const sectionId = button.dataset.scrollTarget;
      if (!sectionId) return;
      if (button.tagName === 'A') {
        event.preventDefault();
      }
      scrollToSection(sectionId);
    });
  });

  document.querySelectorAll('[data-modal-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const modalId = button.dataset.modalTarget;
      if (!modalId) return;
      openModalById(modalId);
    });
  });
};

const setupBookButtons = () => {
  const doctorGrid = document.querySelector('.doctor-grid');
  if (!doctorGrid) return;

  doctorGrid.addEventListener('click', (event) => {
    const bookButton = event.target.closest('.book-btn');
    if (bookButton) {
      const doctorRef = bookButton.dataset.doctorId || bookButton.dataset.doctorName;
      setBookingModalDoctor(doctorRef);
      openModalById('booking-modal');
      return;
    }

    const profileButton = event.target.closest('.view-profile-btn');
    if (profileButton) {
      const doctorRef = profileButton.dataset.doctorId || profileButton.dataset.doctorName;
      openDoctorProfile(doctorRef);
    }
  });

  document.querySelector('.book-profile-btn')?.addEventListener('click', () => {
    if (!state.selectedDoctor) return;
    closeModalById('doctor-details-modal');
    setBookingModalDoctor(state.selectedDoctor);
    openModalById('booking-modal');
  });
};

const setupFilters = () => {
  const filterButtons = document.querySelectorAll('.filter-tab');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.activeFilter = button.dataset.filter;
      setFilterSelection(state.activeFilter);
      applyDoctorFilters();
    });
  });

  const specialtyInput = document.getElementById('specialty-search');
  const areaInput = document.getElementById('area-search');
  [specialtyInput, areaInput].forEach((input) => {
    if (input) {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const form = input.closest('form');
          form?.requestSubmit();
        }
      });
      input.addEventListener('input', applyDoctorFilters);
    }
  });
};

const setupSearchForm = () => {
  const searchForm = document.querySelector('.search-panel');
  if (!searchForm) return;

  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = searchForm.querySelector('.search-btn');
    const originalText = button.textContent;
    button.textContent = 'Searching...';
    button.disabled = true;

    try {
      const specialtyInput = document.getElementById('specialty-search');
      const areaInput = document.getElementById('area-search');
      const specialtyValue = specialtyInput ? specialtyInput.value.trim() : '';
      const areaValue = areaInput ? areaInput.value.trim() : '';

      await searchDoctors(specialtyValue, areaValue);
      showToast('Doctor search updated successfully');
      scrollToSection('doctor-listings');
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  });
};

const setupModals = () => {
  document.querySelectorAll('.close-modal, .close-modal-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal-overlay');
      if (modal) {
        closeModalById(modal.id);
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeModalById(overlay.id);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach((overlay) => closeModalById(overlay.id));
    }
  });

  const appointmentForm = document.getElementById('appointment-form');
  const signInForm = document.getElementById('signin-form');

  document.querySelectorAll('.auth-role-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeAuthRole = tab.dataset.role || 'Patient';
      updateAuthRoleUI();
    });
  });

  const authModeToggle = document.getElementById('auth-mode-toggle');
  authModeToggle?.addEventListener('click', () => {
    state.authMode = state.authMode === 'signin' ? 'signup' : 'signin';
    updateAuthFormMode();
  });

  appointmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = appointmentForm.querySelector('.confirm-btn');
    const originalText = submitButton.textContent;
    const doctor = state.selectedDoctor || getDoctorByName(document.getElementById('booking-title')?.textContent || '');

    submitButton.classList.add('loading');
    submitButton.textContent = 'Confirming...';
    submitButton.disabled = true;

    try {
      const formPayload = new FormData(appointmentForm);
      const payload = {
        doctorId: doctor?.id || doctor?.name || document.getElementById('booking-title')?.textContent || '',
        doctorName: doctor?.name || document.getElementById('booking-title')?.textContent || '',
        specialty: document.getElementById('booking-specialty')?.textContent || '',
        hospital: document.getElementById('booking-clinic')?.textContent || '',
        patientName: formPayload.get('fullName') || '',
        patientPhone: formPayload.get('phone') || '',
        patientEmail: state.currentUser?.email || '',
        patientId: state.currentUser?.id || '',
        date: formPayload.get('date') || '',
        timeSlot: formPayload.get('timeSlot') || '',
        gender: formPayload.get('gender') || 'Male',
        appointmentType: formPayload.get('appointmentType') || 'In-Clinic Visit',
        problem: formPayload.get('description') || '',
      };

      let result;
      if (doctor?.webhookUrl) {
        const webhookResponse = await fetch(doctor.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!webhookResponse.ok) throw new Error('Doctor webhook rejected the appointment.');
        result = { message: `Appointment submitted directly to ${doctor.name}'s system!` };
      } else {
        try {
          result = await apiRequest('/appointments', { method: 'POST', body: JSON.stringify(payload) });
        } catch (error) {
          const localAppointment = { ...payload, id: `local-appointment-${Date.now()}`, status: 'Pending', createdAt: new Date().toISOString() };
          saveAppointments([localAppointment, ...localAppointments()]);
          result = { message: 'Appointment saved locally and will sync when available.', appointment: localAppointment };
        }
        if (result.appointment) saveAppointments([result.appointment, ...localAppointments().filter((item) => String(item.id || item._id) !== String(result.appointment.id || result.appointment._id))]);
      }

      submitButton.textContent = 'Confirmed';
      showToast(result.message || `Appointment requested with ${doctor?.name || 'doctor'}.`);

      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        closeModalById('booking-modal');
        appointmentForm.reset();
      }, 1200);
    } catch (error) {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
      showToast(error.message || 'Unable to submit appointment.', 'error');
    }
  });

  signInForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = signInForm.querySelector('#auth-submit-btn');
    const originalText = submitButton?.textContent || 'Submit';
    const isSignup = state.authMode === 'signup';
    if (isSignup && state.activeAuthRole !== 'Patient') {
      showToast('Only patients can create an account. Doctor access is provided by Admin.', 'error');
      return;
    }
    const formData = new FormData(signInForm);
    const payload = {
      role: state.activeAuthRole,
      email: formData.get('email') || '',
      password: formData.get('password') || '',
    };

    if (isSignup) {
      payload.fullName = formData.get('fullName') || '';
      payload.phoneNumber = formData.get('phoneNumber') || '';
    }

    submitButton.disabled = true;
    submitButton.textContent = isSignup ? 'Creating Account...' : 'Signing In...';

    try {
      let result;
      if (!isSignup && payload.role === 'Admin' && payload.email.toLowerCase() === ADMIN_EMAIL && payload.password === ADMIN_PASSWORD) {
        result = {
          message: 'Super Admin login successful. Admin Dashboard access granted.',
          token: 'true',
          user: { id: 'super-admin', name: 'Super Admin', email: payload.email, role: 'Admin' },
        };
      } else {
        const endpoint = isSignup ? '/auth/register' : '/auth/login';
        const requestPayload = isSignup
          ? { ...payload, name: payload.fullName, phone: payload.phoneNumber }
          : payload;
        try {
          result = await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(requestPayload) });
        } catch (error) {
          const users = getStored('doctorQUsers', []);
          if (isSignup) {
            if (users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) throw new Error('User already exists with this email address.');
            const user = { id: `local-user-${Date.now()}`, name: payload.fullName, email: payload.email.toLowerCase(), password: payload.password, phone: payload.phoneNumber || '', role: 'Patient' };
            users.push(user); setStored('doctorQUsers', users);
            result = { message: 'Patient account created successfully.', user };
          } else {
            const user = users.find((item) => item.email.toLowerCase() === payload.email.toLowerCase() && item.password === payload.password && item.role === payload.role);
            if (!user) throw error;
            result = { message: `${user.role} login successful.`, user };
          }
        }
      }

      if (result.token) localStorage.setItem('doctorQToken', result.token);
      if (result.user) {
        localStorage.setItem('doctorQUser', JSON.stringify(result.user));
        localStorage.setItem('doctorQDashboard', result.user.role);
        state.currentUser = result.user;
        document.body.dataset.authenticatedRole = result.user.role;
        showDashboard(result.user.role, result.user);
      }
      showToast(result.message || (isSignup ? 'Account created successfully.' : 'Signed in successfully.'));
      closeModalById('signin-modal');
      signInForm.reset();
      state.authMode = 'signin';
      updateAuthFormMode();
    } catch (error) {
      showToast(error.message || 'Authentication failed.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
};

const setupMobileMenu = () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!menuToggle || !mobileMenu) return;

  const setMenuState = (isOpen) => {
    state.menuOpen = isOpen;
    menuToggle.classList.toggle('is-active', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.classList.toggle('is-open', isOpen);
  };

  menuToggle.addEventListener('click', () => {
    setMenuState(!state.menuOpen);
  });

  mobileMenu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuState(false);
  });

  document.addEventListener('click', (event) => {
    if (!state.menuOpen) return;
    const clickedInsideMenu = mobileMenu.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);
    if (!clickedInsideMenu && !clickedToggle) {
      setMenuState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) setMenuState(false);
  });
};

const setupFooterActions = () => {
  document.querySelectorAll('.footer-area-link').forEach((button) => {
    button.addEventListener('click', async () => {
      const areaValue = button.dataset.area;
      const areaInput = document.getElementById('area-search');
      if (areaInput) areaInput.value = areaValue;
      state.activeFilter = 'all';
      setFilterSelection(state.activeFilter);
      try {
        await searchDoctors('', areaValue);
      } catch (error) {
        showToast('Unable to load doctors for this area.', 'error');
      }
      scrollToSection('doctor-listings');
      showToast(`Showing doctors near ${areaValue}`);
    });
  });

  document.querySelectorAll('.footer-link').forEach((button) => {
    button.addEventListener('click', () => {
      const modalId = button.dataset.modalTarget;
      const sectionId = button.dataset.scrollTarget;
      if (modalId) {
        openModalById(modalId);
      }
      if (sectionId) {
        scrollToSection(sectionId);
      }
    });
  });
};

const setupAreaCards = () => {
  document.querySelectorAll('.area-card').forEach((button) => {
    button.addEventListener('click', async () => {
      const areaValue = button.dataset.area;
      const areaInput = document.getElementById('area-search');
      if (areaInput) areaInput.value = areaValue;
      state.activeFilter = 'all';
      setFilterSelection(state.activeFilter);
      try {
        await searchDoctors('', areaValue);
      } catch (error) {
        showToast('Unable to load doctors for this area.', 'error');
      }
      scrollToSection('doctor-listings');
      showToast(`Showing doctors from ${areaValue}`);
    });
  });
};

const setupSpecialtyModal = () => {
  const viewAllButton = document.getElementById('view-all-specialties');
  viewAllButton?.addEventListener('click', () => {
    state.specialtiesExpanded = !state.specialtiesExpanded;
    renderSpecialties();
  });
};

const init = async () => {
  const staticDoctors = Array.from(document.querySelectorAll('.doctor-card')).map((card) => normalizeDoctorPayload({
    id: card.dataset.doctorName,
    name: card.dataset.doctorName,
    specialty: card.dataset.specialty,
    hospital: card.dataset.clinic,
    area: card.dataset.area,
    fee: card.dataset.fee,
    image: card.dataset.image,
  }));
  setupMobileSplash();
  renderSpecialties();
  setupNavigation();
  setupBookButtons();
  setupFilters();
  setupSearchForm();
  setupModals();
  setupMobileMenu();
  setupFooterActions();
  setupAreaCards();
  setupAreasToggle();
  setupAboutTabs();
  setupContactForm();
  setupTestimonials();
  setupPasswordToggles();
  setupSpecialtyModal();
  setupDashboardActions();
  setupAdminForm();
  setupDoctorEditor();
  updateAuthFormMode();
  updateDoctorDatalists();
  setFilterSelection('all');

  const savedUser = getStored('doctorQUser', null);
  if (savedUser?.role) {
    state.currentUser = savedUser;
    showDashboard(savedUser.role, savedUser);
  } else if (localStorage.getItem('adminToken') === 'true') {
    enterAdminDashboard();
  }

  try {
    setDoctorLoadingState(true);
    await fetchDoctors();
  } catch (error) {
    showToast(error.message || 'Unable to load doctors right now.', 'error');
    setDoctorLoadingState(false);
    const localDoctors = getStored('doctorQDoctors', []);
    state.doctors = localDoctors.length ? localDoctors : staticDoctors;
    state.adminDoctors = state.doctors;
    updateDoctorDatalists();
    renderDoctorCards(state.doctors);
  }
};

document.addEventListener('DOMContentLoaded', init);
