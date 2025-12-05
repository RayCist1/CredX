const form = document.getElementById('orderForm');
const summary = document.getElementById('orderSummary');
const backHome = document.getElementById('backHome');
const button = document.querySelector('.truck-button');

const CARD_FLAG_KEY = 'credxHasCard';
const CURRENT_USER_KEY = 'credxCurrentUser';
const cardKey = () => {
  const user = localStorage.getItem(CURRENT_USER_KEY) || '__anon';
  return `${CARD_FLAG_KEY}_${user}`;
};
const hasCard = () => localStorage.getItem(cardKey()) === 'true';

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
};

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = validate();
  if (!data) return;

  runAnimation();

  if (summary) {
    summary.classList.remove('hidden');
    summary.textContent = `Deliver to ${data.fullName} at ${data.address}, ${data.city} ${data.zip}. Phone: ${data.phone}.`;
  }
});

backHome?.addEventListener('click', () => {
  window.location.href = 'card.html';
});