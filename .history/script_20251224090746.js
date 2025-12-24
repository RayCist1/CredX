/* script.js */
/* Shared key*/
const CARD_FLAG_KEY = 'credxHasCard';
const CURRENT_USER_KEY = 'credxCurrentUser';
const CARD_DATA_KEY_PREFIX = 'credxCardData';

const getCardKey = () => {
  const user = localStorage.getItem(CURRENT_USER_KEY) || '__anon';
  return `${CARD_FLAG_KEY}_${user}`;
};

const getCardDataKey = () => {
  const user = localStorage.getItem(CURRENT_USER_KEY) || '__anon';
  return `${CARD_DATA_KEY_PREFIX}_${user}`;
};

const setHasCard = (value) => localStorage.setItem(getCardKey(), value ? 'true' : 'false');
const hasCard = () => localStorage.getItem(getCardKey()) === 'true';
const setCurrentUser = (username) => localStorage.setItem(CURRENT_USER_KEY, username || '');
const saveCardData = (data) => localStorage.setItem(getCardDataKey(), JSON.stringify(data || {}));
const loadCardData = () => {
  try {
    const raw = localStorage.getItem(getCardDataKey());
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/* loginregister.html js */

//toggle logic for landing page
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

if (container && registerBtn && loginBtn) {
    console.log('Toggle elements found, attaching listeners');
    registerBtn.addEventListener('click', () => {
      container.classList.add('active');
    });

    loginBtn.addEventListener('click', () => {
      container.classList.remove('active');
    });

    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');

    console.log('Login form:', loginForm);
    console.log('Register form:', registerForm);
  const isValidGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);

  if (loginForm) {
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    
    if (loginPasswordInput && loginError) {
      loginPasswordInput.addEventListener('input', () => {
        if (loginError.textContent) {
          loginError.textContent = '';
        }
      });
    }
    
    loginForm.addEventListener('submit', async (e) => {
      console.log('Login form submitted');
      e.preventDefault();
      console.log('Prevented default');
      const username = document.getElementById('loginUsername')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;
      const loginError = document.getElementById('loginError');

      if (!username || !password) {
        if (loginError) {
          loginError.textContent = 'Please fill out all fields';
        }
        return;
      }

      try {
        const response = await CredXAPI.Auth.login(username, password);
        if (response.success) {
          if (loginError) loginError.textContent = '';
          setCurrentUser(username);
          window.location.href = 'index.html';
        }
      } catch (error) {
        if (loginError) {
          loginError.textContent = error.message || 'Invalid username or password';
        }
      }
    });
  }

  if (registerForm) {
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerError = document.getElementById('registerError');
    
    if (registerPasswordInput && registerError) {
      registerPasswordInput.addEventListener('input', () => {
        if (registerError.textContent) {
          registerError.textContent = '';
        }
      });
    }
    
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('registerUsername')?.value.trim();
      const email = document.getElementById('registerEmail')?.value.trim();
      const password = document.getElementById('registerPassword')?.value;
      const registerError = document.getElementById('registerError');
      
      if (!username || !email || !password) {
        if (registerError) {
          registerError.textContent = 'Please fill out all fields';
        }
        return;
      }

      if (!isValidGmail(email)) {
        if (registerError) {
          registerError.textContent = 'Please enter a valid Gmail address';
        }
        return;
      }

      try {
        const response = await CredXAPI.Auth.register(username, email, password);
        if (response.success) {
          if (registerError) registerError.textContent = '';
          setCurrentUser(username);
          setHasCard(false);
          window.location.href = 'index.html';
        }
      } catch (error) {
        if (registerError) {
          registerError.textContent = error.message || 'Registration failed';
        }
      }
    });
  }
}

/* card.html js */
(function() {
  'use strict';

  // State management
  const state = {
    currentCardBackground: Math.floor(Math.random() * 25 + 1),
    currentCardBackgroundPath: null, // For custom uploaded images
    cardName: "",
    cardNumber: "",
    cardMonth: "",
    cardYear: "",
    cardCvv: "",
    minCardYear: new Date().getFullYear(),
    amexCardMask: "#### ###### #####",
    otherCardMask: "#### #### #### ####",
    isCardFlipped: false,
    focusElementStyle: null,
    isInputFocused: false
  };

  // DOM elements
  const elements = {
    cardItem: null,
    cardNumberInput: null,
    cardNameInput: null,
    cardMonthSelect: null,
    cardYearSelect: null,
    cardCvvInput: null,
    focusElement: null,
    cardNumberDisplay: null,
    cardNameDisplay: null,
    cardMonthDisplay: null,
    cardYearDisplay: null,
    cardCvvDisplay: null,
    cardTypeImg: null,
    cardTypeImgBack: null,
    cardBgFront: null,
    cardBgBack: null
  };

  // Initialize DOM references
  function initElements() {
    elements.cardItem = document.querySelector('.card-item');
    elements.cardNumberInput = document.getElementById('cardNumber');
    elements.cardNameInput = document.getElementById('cardName');
    elements.cardMonthSelect = document.getElementById('cardMonth');
    elements.cardYearSelect = document.getElementById('cardYear');
    elements.cardCvvInput = document.getElementById('cardCvv');
    elements.focusElement = document.querySelector('.card-item__focus');
    elements.cardNumberDisplay = document.querySelector('.card-item__number');
    elements.cardNameDisplay = document.querySelector('.card-item__name');
    elements.cardMonthDisplay = document.querySelector('label[for="cardMonth"].card-item__dateItem span');
    elements.cardYearDisplay = document.querySelector('label[for="cardYear"].card-item__dateItem span');
    elements.cardCvvDisplay = document.getElementById('cardCvvDisplay');
    elements.cardTypeImg = document.querySelector('.card-item__side.-front .card-item__typeImg');
    elements.cardTypeImgBack = document.querySelector('.card-item__side.-back .card-item__typeImg');
    elements.cardBgFront = document.querySelector('.card-item__side.-front .card-item__bg');
    elements.cardBgBack = document.querySelector('.card-item__side.-back .card-item__bg');
  }

  // Get card type based on card number
  function getCardType(number) {
    if (!number) return "visa";
    
    if (/^4/.test(number)) return "visa";
    if (/^(34|37)/.test(number)) return "amex";
    if (/^5[1-5]/.test(number)) return "mastercard";
    if (/^6011/.test(number)) return "discover";
    if (/^9792/.test(number)) return "troy";
    
    return "visa"; // default type
  }

  // Generate card number mask based on card type
  function generateCardNumberMask() {
    const cardType = getCardType(state.cardNumber);
    return cardType === "amex" ? state.amexCardMask : state.otherCardMask;
  }

  // Get minimum card month
  function getMinCardMonth() {
    if (state.cardYear === state.minCardYear) {
      return new Date().getMonth() + 1;
    }
    return 1;
  }

  // Format card number with mask
  function formatCardNumber(value, mask) {
    const numbers = value.replace(/\D/g, '');
    let formatted = '';
    let numberIndex = 0;
    
    for (let i = 0; i < mask.length && numberIndex < numbers.length; i++) {
      if (mask[i] === '#') {
        formatted += numbers[numberIndex];
        numberIndex++;
      } else {
        formatted += mask[i];
      }
    }
    
    return formatted;
  }

  // Update card number display
  function updateCardNumberDisplay() {
    const mask = generateCardNumberMask();
    const cardType = getCardType(state.cardNumber);
    const numbers = state.cardNumber.replace(/\D/g, '');
    const totalDigits = numbers.length;
    
    let html = '';
    let digitIndex = 0; // Track position in the numbers array (0-based)
    
    for (let i = 0; i < mask.length; i++) {
      const char = mask[i];
      const isSpace = char.trim() === '';
      
      if (isSpace) {
        // Add space
        html += `<div class="card-item__numberItem -active"> </div>`;
      } else if (char === '#') {
        // This is a digit position
        if (digitIndex < totalDigits) {
          // Determine if this digit should be visible or masked
          // Show first 4, mask middle, show last 4
          let shouldMask = false;
          
          if (totalDigits > 8) {
            // We have enough digits to mask the middle
            if (cardType === 'amex') {
              // Amex: 15 digits - show first 4 (0-3), mask middle 7 (4-10), show last 4 (11-14)
              if (digitIndex >= 4 && digitIndex < 11) {
                shouldMask = true;
              }
            } else {
              // Regular cards: 16 digits - show first 4 (0-3), mask middle 8 (4-11), show last 4 (12-15)
              if (digitIndex >= 4 && digitIndex < 12) {
                shouldMask = true;
              }
            }
          }
          
          if (shouldMask) {
            html += `<div class="card-item__numberItem">*</div>`;
          } else {
            html += `<div class="card-item__numberItem">${numbers[digitIndex]}</div>`;
          }
          digitIndex++;
        } else {
          // No more digits, show placeholder
          html += `<div class="card-item__numberItem">#</div>`;
        }
      } else {
        // Other character in mask (shouldn't happen, but handle it)
        html += `<div class="card-item__numberItem">${char}</div>`;
      }
    }
    
    elements.cardNumberDisplay.innerHTML = html;
  }

  // Update card name display
  function updateCardNameDisplay() {
    if (state.cardName.length) {
      const name = state.cardName.replace(/\s\s+/g, ' ');
      let html = '';
      for (let i = 0; i < name.length; i++) {
        html += `<span class="card-item__nameItem">${name[i]}</span>`;
      }
      elements.cardNameDisplay.innerHTML = html;
    } else {
      elements.cardNameDisplay.textContent = 'Full Name';
    }
  }

  // Update card date display
  function updateCardDateDisplay() {
    if (elements.cardMonthDisplay) {
      const month = state.cardMonth || 'MM';
      elements.cardMonthDisplay.textContent = month;
    }
    if (elements.cardYearDisplay) {
      const year = state.cardYear ? String(state.cardYear).slice(2, 4) : 'YY';
      elements.cardYearDisplay.textContent = year;
    }
  }

  // Update card CVV display
  function updateCardCvvDisplay() {
    if (elements.cardCvvDisplay) {
      let html = '';
      for (let i = 0; i < state.cardCvv.length; i++) {
        html += `<span>${state.cardCvv[i]}</span>`;
      }
      elements.cardCvvDisplay.innerHTML = html;
    }
  }

  // Update card type image
  function updateCardType() {
    const cardType = getCardType(state.cardNumber);
    if (elements.cardTypeImg) {
      elements.cardTypeImg.src = `./assets/images/${cardType}.png`;
      elements.cardTypeImg.alt = cardType;
    }
    if (elements.cardTypeImgBack) {
      elements.cardTypeImgBack.src = `./assets/images/${cardType}.png`;
      elements.cardTypeImgBack.alt = cardType;
    }
  }

  // Update card background
  function updateCardBackground(imagePath) {
    let path;
    if (imagePath) {
      // Use provided path (for uploads)
      path = imagePath;
      state.currentCardBackgroundPath = imagePath;
    } else if (state.currentCardBackgroundPath) {
      // Use previously uploaded custom image
      path = state.currentCardBackgroundPath;
    } else {
      // Use gallery image
      path = `./assets/images/cardbg/${state.currentCardBackground}.jpeg`;
    }
    
    if (elements.cardBgFront) {
      elements.cardBgFront.src = path;
    }
    if (elements.cardBgBack) {
      elements.cardBgBack.src = path;
    }
  }

  // Flip card
  function flipCard(status) {
    state.isCardFlipped = status;
    if (elements.cardItem) {
      if (status) {
        elements.cardItem.classList.add('-active');
      } else {
        elements.cardItem.classList.remove('-active');
      }
    }
  }

  // Focus input handler
  function focusInput(e) {
    state.isInputFocused = true;
    const targetRef = e.target.dataset.ref;
    let target = null;
    
    // Find target element by ref attribute
    if (targetRef === 'cardNumber') {
      target = document.querySelector('label[for="cardNumber"]');
    } else if (targetRef === 'cardName') {
      target = document.querySelector('label[for="cardName"]');
    } else if (targetRef === 'cardDate') {
      target = document.querySelector('.card-item__date');
    }
    
    if (target && elements.focusElement && elements.cardItem) {
      const rect = target.getBoundingClientRect();
      const cardRect = elements.cardItem.getBoundingClientRect();
      
      state.focusElementStyle = {
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        transform: `translateX(${rect.left - cardRect.left}px) translateY(${rect.top - cardRect.top}px)`
      };
      
      elements.focusElement.style.width = state.focusElementStyle.width;
      elements.focusElement.style.height = state.focusElementStyle.height;
      elements.focusElement.style.transform = state.focusElementStyle.transform;
      elements.focusElement.classList.add('-active');
    }
  }

  // Blur input handler
  function blurInput() {
    state.isInputFocused = false;
    setTimeout(() => {
      if (!state.isInputFocused && elements.focusElement) {
        elements.focusElement.classList.remove('-active');
        state.focusElementStyle = null;
      }
    }, 300);
  }

  // Input mask handler
  function applyMask(input, mask) {
    const value = input.value.replace(/\D/g, '');
    const formatted = formatCardNumber(value, mask);
    input.value = formatted;
    return value;
  }

  // Initialize month options
  function initMonthOptions() {
    if (!elements.cardMonthSelect) return;
    
    const currentMonth = new Date().getMonth() + 1;
    const minMonth = state.cardYear === state.minCardYear ? currentMonth : 1;
    
    elements.cardMonthSelect.innerHTML = '<option value="" disabled selected>Month</option>';
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement('option');
      option.value = i < 10 ? '0' + i : String(i);
      option.textContent = i < 10 ? '0' + i : String(i);
      option.disabled = i < minMonth;
      elements.cardMonthSelect.appendChild(option);
    }
  }

  // Initialize year options
  function initYearOptions() {
    if (!elements.cardYearSelect) return;
    
    elements.cardYearSelect.innerHTML = '<option value="" disabled selected>Year</option>';
    for (let i = 0; i < 12; i++) {
      const option = document.createElement('option');
      const year = state.minCardYear + i;
      option.value = year;
      option.textContent = year;
      elements.cardYearSelect.appendChild(option);
    }
  }

  // Event listeners
  function setupEventListeners() {
    // Card number input
    if (elements.cardNumberInput) {
      elements.cardNumberInput.addEventListener('input', (e) => {
        const mask = generateCardNumberMask();
        const value = applyMask(e.target, mask);
        state.cardNumber = value;
        updateCardNumberDisplay();
        updateCardType();
      });
      
      elements.cardNumberInput.addEventListener('focus', focusInput);
      elements.cardNumberInput.addEventListener('blur', blurInput);
    }

    // Card name input
    if (elements.cardNameInput) {
      elements.cardNameInput.addEventListener('input', (e) => {
        state.cardName = e.target.value;
        updateCardNameDisplay();
      });
      
      elements.cardNameInput.addEventListener('focus', focusInput);
      elements.cardNameInput.addEventListener('blur', blurInput);
    }

    // Card month select
    if (elements.cardMonthSelect) {
      elements.cardMonthSelect.addEventListener('change', (e) => {
        state.cardMonth = e.target.value;
        // Update display immediately
        if (elements.cardMonthDisplay) {
          elements.cardMonthDisplay.textContent = state.cardMonth || 'MM';
        }
        updateCardDateDisplay();
      });
      
      elements.cardMonthSelect.addEventListener('focus', focusInput);
      elements.cardMonthSelect.addEventListener('blur', blurInput);
    }

    // Card year select
    if (elements.cardYearSelect) {
      elements.cardYearSelect.addEventListener('change', (e) => {
        state.cardYear = e.target.value;
        if (state.cardMonth && parseInt(state.cardMonth) < getMinCardMonth()) {
          state.cardMonth = '';
          elements.cardMonthSelect.value = '';
        }
        initMonthOptions();
        updateCardDateDisplay();
      });
      
      elements.cardYearSelect.addEventListener('focus', focusInput);
      elements.cardYearSelect.addEventListener('blur', blurInput);
    }

    // Card CVV input
    if (elements.cardCvvInput) {
      elements.cardCvvInput.addEventListener('input', (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 3);
        e.target.value = value;
        state.cardCvv = value;
        updateCardCvvDisplay();
      });
      
      elements.cardCvvInput.addEventListener('focus', () => {
        flipCard(true);
      });
      
      elements.cardCvvInput.addEventListener('blur', () => {
        flipCard(false);
      });
    }

    const cardForm = document.getElementById('cardForm');
    const submitBtn = document.querySelector('.card-form__button');

    if (cardForm && submitBtn) {
      submitBtn.type = 'submit';

      cardForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const missing = [];
        if (!state.cardNumber || state.cardNumber.length < 12) missing.push('card number');
        if (!state.cardName) missing.push('card holder name');
        if (!state.cardMonth || !state.cardYear) missing.push('expiration date');
        if (!state.cardCvv || state.cardCvv.length < 3) missing.push('CVV');

        if (missing.length) {
          alert(`Please fill your ${missing.join(', ')} to continue.`);
          return;
        }

        try {
          // Check if user is authenticated
          const token = CredXAPI.getAuthToken();
          if (!token) {
            alert('Please login first');
            window.location.href = 'loginregister.html';
            return;
          }

          // Save card to backend
          await CredXAPI.Card.saveCard({
            cardNumber: state.cardNumber.replace(/\D/g, ''),
            cardName: state.cardName || 'Full Name',
            cardMonth: state.cardMonth,
            cardYear: state.cardYear,
            cardBg: state.currentCardBackgroundPath
              ? state.currentCardBackgroundPath
              : `./assets/images/cardbg/${state.currentCardBackground}.jpeg`,
            cardType: getCardType(state.cardNumber)
          });

          // Also save locally for backward compatibility
          setHasCard(true);
          saveCardData({
            cardNumber: state.cardNumber.replace(/\D/g, '').slice(-16),
            cardName: state.cardName || 'Full Name',
            cardMonth: state.cardMonth,
            cardYear: state.cardYear,
            cardBg: state.currentCardBackgroundPath
              ? state.currentCardBackgroundPath
              : `./assets/images/cardbg/${state.currentCardBackground}.jpeg`,
            cardType: getCardType(state.cardNumber)
          });
          
          window.location.href = 'order.html';
        } catch (error) {
          alert('Error saving card: ' + (error.message || 'Please try again'));
        }
      });
    }

    // Background selection functionality
    setupBackgroundSelection();
  }

  // Setup background selection (gallery and upload)
  function setupBackgroundSelection() {
    const chooseBackgroundBtn = document.getElementById('chooseBackgroundBtn');
    const uploadBackgroundBtn = document.getElementById('uploadBackgroundBtn');
    const backgroundUpload = document.getElementById('backgroundUpload');
    const backgroundModal = document.getElementById('backgroundModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const backgroundGallery = document.getElementById('backgroundGallery');

    // Open gallery modal
    if (chooseBackgroundBtn && backgroundModal) {
      chooseBackgroundBtn.addEventListener('click', () => {
        populateGallery();
        backgroundModal.classList.add('show');
      });
    }

    // Close modal
    if (closeModalBtn && backgroundModal) {
      closeModalBtn.addEventListener('click', () => {
        backgroundModal.classList.remove('show');
      });
    }

    // Close modal when clicking outside
    if (backgroundModal) {
      backgroundModal.addEventListener('click', (e) => {
        if (e.target === backgroundModal) {
          backgroundModal.classList.remove('show');
        }
      });
    }

    // Populate gallery with available backgrounds
    function populateGallery() {
      if (!backgroundGallery) return;
      
      backgroundGallery.innerHTML = '';
      
      // Create 25 background options (1.jpeg to 25.jpeg)
      for (let i = 1; i <= 25; i++) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'background-modal__gallery-item';
        if (state.currentCardBackground === i && !state.currentCardBackgroundPath) {
          galleryItem.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = `./assets/images/cardbg/${i}.jpeg`;
        img.alt = `Background ${i}`;
        img.loading = 'lazy';
        
        galleryItem.appendChild(img);
        
        galleryItem.addEventListener('click', () => {
          // Remove selected class from all items
          document.querySelectorAll('.background-modal__gallery-item').forEach(item => {
            item.classList.remove('selected');
          });
          
          // Add selected class to clicked item
          galleryItem.classList.add('selected');
          
          // Update card background
          state.currentCardBackground = i;
          state.currentCardBackgroundPath = null;
          updateCardBackground();
          
          // Close modal after a short delay
          setTimeout(() => {
            backgroundModal.classList.remove('show');
          }, 300);
        });
        
        backgroundGallery.appendChild(galleryItem);
      }
    }

    // Handle file upload
    if (uploadBackgroundBtn && backgroundUpload) {
      uploadBackgroundBtn.addEventListener('click', () => {
        backgroundUpload.click();
      });

      backgroundUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imagePath = event.target.result;
            state.currentCardBackgroundPath = imagePath;
            updateCardBackground(imagePath);
          };
          reader.readAsDataURL(file);
        } else {
          alert('Please select a valid image file.');
        }
      });
    }
  }

  // Initialize application
  function init() {
    initElements();
    initMonthOptions();
    initYearOptions();
    setupEventListeners();
    updateCardBackground();
    updateCardNumberDisplay();
    updateCardNameDisplay();
    updateCardDateDisplay();
    updateCardType();
    
    // Ensure month display is initialized
    if (elements.cardMonthDisplay) {
      elements.cardMonthDisplay.textContent = state.cardMonth || 'MM';
    }
    if (elements.cardYearDisplay) {
      elements.cardYearDisplay.textContent = state.cardYear ? String(state.cardYear).slice(2, 4) : 'YY';
    }
    
    // Focus card number input on load
    if (elements.cardNumberInput) {
      elements.cardNumberInput.focus();
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* index.html js  */
(function() {
  'use strict';
  
  async function initHomepage() {
    const currentUser = localStorage.getItem('credxCurrentUser');
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeMessage = document.getElementById('welcome-message');
    
    // Check if user has valid token
    const token = CredXAPI.getAuthToken();
    let isAuthenticated = false;
    
    if (token && currentUser) {
      try {
        await CredXAPI.Auth.verify();
        isAuthenticated = true;
      } catch (error) {
        // Token invalid, clear it
        CredXAPI.Auth.logout();
        localStorage.removeItem('credxCurrentUser');
      }
    }
    
    // Show/hide login buttons or user info based on login status
    if (isAuthenticated && currentUser) {
      // User is logged in
      if (authButtons) authButtons.style.display = 'none';
      if (userInfo) userInfo.style.display = 'flex';
      if (usernameDisplay) usernameDisplay.textContent = currentUser;
      if (welcomeMessage) {
        welcomeMessage.innerHTML = `<p>Welcome, <strong>${currentUser}</strong>!</p>`;
      }
    } else {
      // User is not logged in
      if (authButtons) authButtons.style.display = 'flex';
      if (userInfo) userInfo.style.display = 'none';
    }
    
    // Logout functionality
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        CredXAPI.Auth.logout();
        localStorage.removeItem('credxCurrentUser');
        window.location.href = 'index.html';
      });
    }

    // Scroll animation observer
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    // Observe all scroll-animate elements
    document.querySelectorAll('.scroll-animate').forEach(el => {
      observer.observe(el);
    });

    // Back to top button functionality
    const backToTopButton = document.getElementById('backToTop');
    if (backToTopButton) {
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          backToTopButton.classList.add('show');
        } else {
          backToTopButton.classList.remove('show');
        }
      });
      
      backToTopButton.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomepage);
  } else {
    initHomepage();
  }
})();

/* order.html js */
(function() {
  'use strict';
  
  function initOrder() {
    const form = document.getElementById('orderForm');
    const summary = document.getElementById('orderSummary');
    const backHome = document.getElementById('backHome');
    const button = document.querySelector('.truck-button');

    const validate = () => {
      if (!form) return false;
      const fullName = form.fullName.value.trim();
      const phone = form.phone.value.trim();
      const address = form.address.value.trim();
      const city = form.city.value.trim();
      const zip = form.zip.value.trim();

      if (!fullName || !phone || !address || !city || !zip) {
        alert('Please fill in all delivery fields first.');
        return false;
      }

      if (phone.replace(/\D/g, '').length < 7) {
        alert('Please enter a valid phone number.');
        return false;
      }

      return { fullName, phone, address, city, zip };
    };

    const runAnimation = () => {
      if (!button) return;
      const box = button.querySelector('.box');
      const truck = button.querySelector('.truck');

      if (button.classList.contains('done') || button.classList.contains('animation')) return;

      button.classList.add('animation');

      if (typeof gsap !== 'undefined') {
        gsap.to(button, {
          '--box-s': 1,
          '--box-o': 1,
          duration: .3,
          delay: .5
        });

        gsap.to(box, {
          x: 0,
          duration: .4,
          delay: .7
        });

        gsap.to(button, {
          '--hx': -5,
          '--bx': 50,
          duration: .18,
          delay: .92
        });

        gsap.to(box, {
          y: 0,
          duration: .1,
          delay: 1.15
        });

        gsap.set(button, {
          '--truck-y': 0,
          '--truck-y-n': -26
        });

        gsap.to(button, {
          '--truck-y': 1,
          '--truck-y-n': -25,
          duration: .2,
          delay: 1.25,
          onComplete() {
            gsap.timeline({
              onComplete() {
                button.classList.add('done');
              }
            }).to(truck, {
              x: 0,
              duration: .4
            }).to(truck, {
              x: 40,
              duration: 1
            }).to(truck, {
              x: 20,
              duration: .6
            }).to(truck, {
              x: 96,
              duration: .4
            });
            gsap.to(button, {
              '--progress': 1,
              duration: 2.4,
              ease: "power2.in"
            });
          }
        });
      }
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = validate();
        if (!data) return;

        runAnimation();

        if (summary) {
          summary.classList.remove('hidden');
          summary.textContent = `Deliver to ${data.fullName} at ${data.address}, ${data.city} ${data.zip}. Phone: ${data.phone}.`;
        }
      });
    }

    if (backHome) {
      backHome.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrder);
  } else {
    initOrder();
  }
})();

/* wallet.html js */
(function() {
  'use strict';
  
  // Wallet API functions (using backend)
  let walletBalanceCache = null;
  let walletTransactionsCache = [];
  let walletStatsCache = null;
  
  async function getWalletBalance() {
    try {
      if (!CredXAPI.getAuthToken()) {
        return 5254.50; // Default balance if not logged in
      }
      const balance = await CredXAPI.Wallet.getBalance();
      walletBalanceCache = balance;
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return walletBalanceCache || 5254.50;
    }
  }
  
  async function setWalletBalance(amount) {
    try {
      await CredXAPI.Wallet.updateBalance(amount);
      walletBalanceCache = amount;
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }
  
  async function getTransactions() {
    try {
      if (!CredXAPI.getAuthToken()) {
        return []; // Return empty if not logged in
      }
      const transactions = await CredXAPI.Wallet.getTransactions();
      walletTransactionsCache = transactions;
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return walletTransactionsCache || [];
    }
  }
  
  async function addTransaction(transaction) {
    try {
      const newTransaction = await CredXAPI.Wallet.addTransaction({
        purpose: transaction.purpose,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status || 'Done'
      });
      walletTransactionsCache.unshift(newTransaction);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }
  
  async function getStats() {
    try {
      if (!CredXAPI.getAuthToken()) {
        return { income: 2430, spent: 1120 };
      }
      const stats = await CredXAPI.Wallet.getStats();
      walletStatsCache = stats;
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return walletStatsCache || { income: 2430, spent: 1120 };
    }
  }
  
  async function updateStats(income = 0, spent = 0) {
    // Stats are automatically updated by the backend when transactions are added
    // This function is kept for compatibility but doesn't need to do anything
  }
  
  // Update wallet display
  function updateWalletDisplay() {
    const balance = getWalletBalance();
    const balanceEl = document.getElementById('wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      balanceEl.style.animation = 'pulse 0.5s ease';
      setTimeout(() => {
        balanceEl.style.animation = '';
      }, 500);
    }
    
    // Update stats
    const stats = getStats();
    const incomeEl = document.querySelector('.stat .positive');
    const spentEl = document.querySelector('.stat .negative');
    if (incomeEl) {
      incomeEl.textContent = `+$${stats.income.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (spentEl) {
      spentEl.textContent = `-$${stats.spent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
    // Update transactions
    updateTransactionsDisplay();
  }
  
  // Filter transactions function
  function filterTransactions(filterType) {
    const transactionRows = document.querySelectorAll('.row[data-type]');
    
    transactionRows.forEach(row => {
      if (filterType === 'all') {
        row.style.display = '';
        row.style.animation = 'fadeIn 0.3s ease';
      } else if (filterType === 'income') {
        if (row.dataset.type === 'income') {
          row.style.display = '';
          row.style.animation = 'fadeIn 0.3s ease';
        } else {
          row.style.display = 'none';
        }
      } else if (filterType === 'expense') {
        if (row.dataset.type === 'expense') {
          row.style.display = '';
          row.style.animation = 'fadeIn 0.3s ease';
        } else {
          row.style.display = 'none';
        }
      }
    });
  }
  
  function updateTransactionsDisplay() {
    const transactions = getTransactions();
    const table = document.querySelector('.table');
    if (!table) return;
    
    // Remove existing transaction rows (keep header)
    const existingRows = table.querySelectorAll('.row[data-type]');
    existingRows.forEach(row => row.remove());
    
    // Add transactions
    transactions.slice(0, 10).forEach(transaction => {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.type = transaction.type;
      row.innerHTML = `
        <span class="title">${transaction.purpose}</span>
        <span>${transaction.date}</span>
        <span class="${transaction.amount < 0 ? 'negative' : 'positive'}">${transaction.amount < 0 ? '-' : '+'}$${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span><span class="pill ${transaction.status === 'Done' ? 'success' : 'warning'}">${transaction.status}</span></span>
      `;
      table.appendChild(row);
    });
    
    // Apply current filter
    const activeFilter = document.querySelector('.chip-btn.active');
    if (activeFilter) {
      filterTransactions(activeFilter.dataset.filter);
    }
  }
  
  // Modal functions
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    } else {
      console.error('Modal not found:', modalId);
    }
  }
  
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
      // Reset form
      const form = modal.querySelector('form');
      if (form) form.reset();
    }
  }
  
  function showSuccess(message) {
    alert(message);
  }
  
  async function initWallet() {
    try {
      // Check if user is authenticated
      const token = CredXAPI.getAuthToken();
      if (!token) {
        // Redirect to login if not authenticated
        window.location.href = 'loginregister.html';
        return;
      }
      
      // Verify token
      try {
        await CredXAPI.Auth.verify();
      } catch (error) {
        // Token invalid, redirect to login
        CredXAPI.Auth.logout();
        window.location.href = 'loginregister.html';
        return;
      }
      
      const currentUser = localStorage.getItem(CURRENT_USER_KEY);
      
      // Update welcome message
      const welcomeEl = document.getElementById('wallet-welcome');
      if (welcomeEl && currentUser) {
        welcomeEl.textContent = `Welcome back, ${currentUser}`;
      }
      
      // Load card from backend
      try {
        const cardResponse = await CredXAPI.Card.getCard();
        if (cardResponse.success && cardResponse.card) {
          const cardData = cardResponse.card;
          const cardNumberEl = document.getElementById('wallet-card-number');
          const cardNameEl = document.getElementById('wallet-card-name-label');
          const cardExpiryEl = document.getElementById('wallet-card-expiry');
          
          if (cardNumberEl && cardData.card_number) {
            cardNumberEl.textContent = cardData.card_number; // Already masked from backend
          }
          if (cardNameEl && cardData.card_name) {
            cardNameEl.textContent = cardData.card_name;
          }
          if (cardExpiryEl && cardData.card_month && cardData.card_year) {
            cardExpiryEl.textContent = `${cardData.card_month}/${String(cardData.card_year).slice(2)}`;
          }
        } else {
          // Fallback to local storage
          const cardData = loadCardData();
          if (cardData) {
            const cardNumberEl = document.getElementById('wallet-card-number');
            const cardNameEl = document.getElementById('wallet-card-name-label');
            const cardExpiryEl = document.getElementById('wallet-card-expiry');
            
            if (cardNumberEl && cardData.cardNumber) {
              const masked = maskCardNumber(cardData.cardNumber);
              cardNumberEl.textContent = masked;
            }
            if (cardNameEl && cardData.cardName) {
              cardNameEl.textContent = cardData.cardName;
            }
            if (cardExpiryEl && cardData.cardMonth && cardData.cardYear) {
              cardExpiryEl.textContent = `${cardData.cardMonth}/${String(cardData.cardYear).slice(2)}`;
            }
          }
        }
      } catch (error) {
        console.error('Error loading card:', error);
        // Fallback to local storage
        const cardData = loadCardData();
        if (cardData) {
          const cardNumberEl = document.getElementById('wallet-card-number');
          const cardNameEl = document.getElementById('wallet-card-name-label');
          const cardExpiryEl = document.getElementById('wallet-card-expiry');
          
          if (cardNumberEl && cardData.cardNumber) {
            const masked = maskCardNumber(cardData.cardNumber);
            cardNumberEl.textContent = masked;
          }
          if (cardNameEl && cardData.cardName) {
            cardNameEl.textContent = cardData.cardName;
          }
          if (cardExpiryEl && cardData.cardMonth && cardData.cardYear) {
            cardExpiryEl.textContent = `${cardData.cardMonth}/${String(cardData.cardYear).slice(2)}`;
          }
        }
      }
      
      // Update wallet display
      await updateWalletDisplay();
    } catch (error) {
      console.error('Error initializing wallet:', error);
      // If API fails, try to use local storage as fallback
      const cardData = loadCardData();
      const currentUser = localStorage.getItem(CURRENT_USER_KEY);
      
      if (welcomeEl && currentUser) {
        welcomeEl.textContent = `Welcome back, ${currentUser}`;
      }
      
      if (cardData) {
        const cardNumberEl = document.getElementById('wallet-card-number');
        const cardNameEl = document.getElementById('wallet-card-name-label');
        const cardExpiryEl = document.getElementById('wallet-card-expiry');
        
        if (cardNumberEl && cardData.cardNumber) {
          const masked = maskCardNumber(cardData.cardNumber);
          cardNumberEl.textContent = masked;
        }
        if (cardNameEl && cardData.cardName) {
          cardNameEl.textContent = cardData.cardName;
        }
        if (cardExpiryEl && cardData.cardMonth && cardData.cardYear) {
          cardExpiryEl.textContent = `${cardData.cardMonth}/${String(cardData.cardYear).slice(2)}`;
        }
      }
    }
    
    // Filter buttons functionality
    const filterButtons = document.querySelectorAll('.chip-btn[data-filter]');
    
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        filterTransactions(filter);
      });
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.dataset.modal;
        if (modalId) closeModal(modalId);
      });
    });
    
    // Close modal on background click
    document.querySelectorAll('.wallet-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });
    });
    
    // Wallet action buttons functionality
    const actionButtons = document.querySelectorAll('.quick-actions .action');
    const addMoneyBtn = document.querySelector('.primary-btn');
    
    // Send money (first button)
    if (actionButtons.length > 0) {
      actionButtons[0].addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal('sendModal');
      });
    }
    
    // Request money (second button)
    if (actionButtons.length > 1) {
      actionButtons[1].addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal('requestModal');
      });
    }
    
    // Transfer money (third button)
    if (actionButtons.length > 2) {
      actionButtons[2].addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal('transferModal');
      });
    }
    
    // Top up (fourth button)
    if (actionButtons.length > 3) {
      actionButtons[3].addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal('topUpModal');
      });
    }
    
    // Add money
    if (addMoneyBtn) {
      addMoneyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal('addMoneyModal');
      });
    }
    
    // Form submissions
    const sendForm = document.getElementById('sendForm');
    if (sendForm) {
      sendForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('sendAmount').value);
        const recipient = document.getElementById('sendRecipient').value;
        const note = document.getElementById('sendNote').value;
        
        if (!amount || amount <= 0 || !recipient) {
          alert('Please fill in all required fields');
          return;
        }
        
        try {
          const balance = await getWalletBalance();
          
          if (amount > balance) {
            alert('Insufficient balance!');
            return;
          }
          
          await setWalletBalance(balance - amount);
          await addTransaction({
            purpose: `Send to ${recipient}${note ? ` - ${note}` : ''}`,
            amount: -amount,
            type: 'expense',
            status: 'Done'
          });
          await updateWalletDisplay();
          closeModal('sendModal');
          showSuccess(`Successfully sent $${amount.toFixed(2)} to ${recipient}!`);
        } catch (error) {
          alert('Error: ' + (error.message || 'Failed to send money'));
        }
      });
    }
    
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
      requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('requestAmount').value);
        const from = document.getElementById('requestFrom').value;
        const note = document.getElementById('requestNote').value;
        
        if (!amount || amount <= 0 || !from) {
          alert('Please fill in all required fields');
          return;
        }
        
        try {
          await addTransaction({
            purpose: `Request from ${from}${note ? ` - ${note}` : ''}`,
            amount: amount,
            type: 'income',
            status: 'Pending'
          });
          await updateWalletDisplay();
          closeModal('requestModal');
          showSuccess(`Payment request sent to ${from} for $${amount.toFixed(2)}!`);
        } catch (error) {
          alert('Error: ' + (error.message || 'Failed to send request'));
        }
      });
    }
    
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
      transferForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const toAccount = document.getElementById('transferTo').value;
        
        if (!amount || amount <= 0 || !toAccount) {
          alert('Please fill in all required fields');
          return;
        }
        
        try {
          const balance = await getWalletBalance();
          
          if (amount > balance) {
            alert('Insufficient balance!');
            return;
          }
          
          await setWalletBalance(balance - amount);
          await addTransaction({
            purpose: `Transfer to ${toAccount}`,
            amount: -amount,
            type: 'expense',
            status: 'Done'
          });
          await updateWalletDisplay();
          closeModal('transferModal');
          showSuccess(`Successfully transferred $${amount.toFixed(2)} to ${toAccount}!`);
        } catch (error) {
          alert('Error: ' + (error.message || 'Failed to transfer money'));
        }
      });
    }
    
    const topUpForm = document.getElementById('topUpForm');
    if (topUpForm) {
      topUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('topUpAmount').value);
        const method = document.getElementById('topUpMethod').value;
        
        if (!amount || amount <= 0 || !method) {
          alert('Please fill in all required fields');
          return;
        }
        
        try {
          const balance = await getWalletBalance();
          await setWalletBalance(balance + amount);
          await addTransaction({
            purpose: `Top up via ${method}`,
            amount: amount,
            type: 'income',
            status: 'Done'
          });
          await updateWalletDisplay();
          closeModal('topUpModal');
          showSuccess(`Successfully topped up $${amount.toFixed(2)}!`);
        } catch (error) {
          alert('Error: ' + (error.message || 'Failed to top up'));
        }
      });
    }
    
    const addMoneyForm = document.getElementById('addMoneyForm');
    if (addMoneyForm) {
      addMoneyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('addMoneyAmount').value);
        const source = document.getElementById('addMoneySource').value;
        
        if (!amount || amount <= 0 || !source) {
          alert('Please fill in all required fields');
          return;
        }
        
        try {
          const balance = await getWalletBalance();
          await setWalletBalance(balance + amount);
          await addTransaction({
            purpose: `Add money from ${source}`,
            amount: amount,
            type: 'income',
            status: 'Done'
          });
          await updateWalletDisplay();
          closeModal('addMoneyModal');
          showSuccess(`Successfully added $${amount.toFixed(2)} to your wallet!`);
        } catch (error) {
          alert('Error: ' + (error.message || 'Failed to add money'));
        }
      });
    }
  }
  
  // Helper function to mask card number
  function maskCardNumber(number) {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length < 4) return '**** **** **** ****';
    const last4 = cleaned.slice(-4);
    return `**** **** **** ${last4}`;
  }
  
  // Add fadeIn animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `;
  document.head.appendChild(style);
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWallet);
  } else {
    initWallet();
  }
})();
