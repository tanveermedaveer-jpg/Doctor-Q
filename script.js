const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

const state = {
  activeFilter: 'all',
  menuOpen: false,
  selectedDoctor: null,
  specialtiesExpanded: false,
  doctors: [],
  loadingDoctors: false,
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

const scrollToSection = (sectionId) => {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const openModalById = (id) => {
  const modal = document.getElementById(id);
  if (!modal) return;
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
    specialty,
    category: deriveDoctorCategory(specialty, doctor.category || doctor.categoryName || 'all'),
    clinic,
    area,
    fee: feeValue,
    qualification: doctor.qualification || doctor.qualifications || doctor.degree || 'MBBS',
    timings: doctor.timings || doctor.schedule || doctor.availableTime || 'Flexible',
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

  if (!doctorList.length) {
    doctorGrid.innerHTML = `
      <div class="doctor-state-message">
        <p>No doctors match the current search.</p>
        <small>Try a different specialty, area, or hospital name.</small>
      </div>
    `;
    return;
  }

  doctorGrid.innerHTML = doctorList
    .map(
      (doctor) => `
        <article class="doctor-card reveal" data-category="${doctor.category}" data-doctor-name="${doctor.name}" data-specialty="${doctor.specialty}" data-clinic="${doctor.clinic}" data-area="${doctor.area}" data-fee="${doctor.fee}" data-image="${doctor.image}">
          <div class="doctor-image-wrap">
            <img src="${doctor.image}" alt="${doctor.name}" />
            <span class="availability-badge">Available Today</span>
          </div>
          <div class="doctor-body">
            <div class="doctor-mainline">
              <div>
                <h3>${doctor.name}</h3>
                <p>${doctor.qualification}</p>
              </div>
              <span class="rating">${Number(doctor.rating).toFixed(1)} ★</span>
            </div>
            <p class="specialty">${doctor.specialty}</p>
            <div class="meta-row">
              <span>📍 ${doctor.clinic}</span>
            </div>
            <div class="meta-row">
              <span>🕒 ${doctor.timings}</span>
            </div>
            <div class="card-footer">
              <strong>PKR ${Number(doctor.fee).toLocaleString()}</strong>
              <div class="cta-actions">
                <button type="button" class="btn btn-primary small-btn book-btn" data-doctor-name="${doctor.name}">Book Appointment</button>
                <button type="button" class="view-profile-btn" data-doctor-name="${doctor.name}">View Profile</button>
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
  state.doctors = doctors;

  if (!doctors.length) {
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
    state.doctors = doctors;
    applyDoctorFilters();
    if (!doctors.length) {
      showToast('No doctors match this search.', 'error');
    }
  } catch (error) {
    showToast(error.message || 'Unable to search doctors.', 'error');
  }
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
      const doctorName = bookButton.dataset.doctorName;
      setBookingModalDoctor(doctorName);
      openModalById('booking-modal');
      return;
    }

    const profileButton = event.target.closest('.view-profile-btn');
    if (profileButton) {
      const doctorName = profileButton.dataset.doctorName;
      openDoctorProfile(doctorName);
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
        patientName: formPayload.get('patientName') || '',
        mobileNumber: formPayload.get('mobileNumber') || '',
        preferredDate: formPayload.get('preferredDate') || '',
        timeSlot: formPayload.get('timeSlot') || '',
        gender: formPayload.get('gender') || 'Male',
        appointmentType: formPayload.get('appointmentType') || 'In-Clinic Visit',
        problem: formPayload.get('problem') || '',
      };

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Unable to book appointment right now.');
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

  signInForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    showToast('Signed in successfully');
    closeModalById('signin-modal');
    signInForm.reset();
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

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
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
  renderSpecialties();
  setupNavigation();
  setupBookButtons();
  setupFilters();
  setupSearchForm();
  setupModals();
  setupMobileMenu();
  setupFooterActions();
  setupAreaCards();
  setupSpecialtyModal();
  setFilterSelection('all');

  try {
    setDoctorLoadingState(true);
    await fetchDoctors();
  } catch (error) {
    showToast(error.message || 'Unable to load doctors right now.', 'error');
    setDoctorLoadingState(false);
    renderDoctorCards([]);
  }
};

document.addEventListener('DOMContentLoaded', init);
