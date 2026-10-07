/**
 * ============================================================================
 * PASSENGER REGISTRATION PAGE LOGIC (passenger-register.js)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  generateSuggestedPassengerId();
  initFormValidation();
  loadRecentPassengers();
});

function generateSuggestedPassengerId() {
  const idInput = document.getElementById('passenger_id');
  if (idInput && !idInput.value) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    idInput.value = `PSG${randomNum}`;
  }
}

function initFormValidation() {
  const form = document.getElementById('passenger-register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const passenger_id = document.getElementById('passenger_id').value.trim();
    const name = document.getElementById('name').value.trim();
    const age = parseInt(document.getElementById('age').value, 10);
    const gender = document.getElementById('gender').value;
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    let isValid = true;

    // Field Validations
    if (!passenger_id) {
      setError('passenger_id', 'Passenger ID is required');
      isValid = false;
    } else {
      clearError('passenger_id');
    }

    if (!name || name.length < 3) {
      setError('name', 'Please enter a valid full name (minimum 3 characters)');
      isValid = false;
    } else {
      clearError('name');
    }

    if (isNaN(age) || age < 1 || age > 120) {
      setError('age', 'Please enter a valid age between 1 and 120');
      isValid = false;
    } else {
      clearError('age');
    }

    if (!gender) {
      setError('gender', 'Please select gender');
      isValid = false;
    } else {
      clearError('gender');
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('phone', 'Please enter a valid 10-digit mobile number');
      isValid = false;
    } else {
      clearError('phone');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('email', 'Please enter a valid email address');
      isValid = false;
    } else {
      clearError('email');
    }

    if (!isValid) {
      window.showToast('Please correct the errors in the form.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('register-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Registering Passenger...';
    }

    try {
      const payload = {
        passenger_id,
        name,
        age,
        gender,
        phone,
        email
      };

      const res = await window.RailwayAPI.createPassenger(payload);

      if (res.success) {
        window.showToast(`Passenger registered successfully! ID: ${passenger_id}`, 'success');
        
        // Save current active passenger for quick auto-fill in booking page
        localStorage.setItem('railway_last_passenger_id', passenger_id);

        form.reset();
        generateSuggestedPassengerId();
        loadRecentPassengers();

        // Show prompt to book ticket or stay
        const redirect = confirm(`Passenger "${name}" registered successfully!\n\nWould you like to proceed to Book a Ticket now?`);
        if (redirect) {
          window.location.href = `trains.html`;
        }
      }
    } catch (err) {
      window.showToast(`Registration failed: ${err.message}`, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Register Passenger';
      }
    }
  });
}

function setError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('is-invalid');
  let feedback = input.nextElementSibling;
  if (!feedback || !feedback.classList.contains('invalid-feedback')) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    input.parentNode.appendChild(feedback);
  }
  feedback.textContent = message;
  feedback.style.display = 'block';
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.remove('is-invalid');
  const feedback = input.nextElementSibling;
  if (feedback && feedback.classList.contains('invalid-feedback')) {
    feedback.style.display = 'none';
  }
}

async function loadRecentPassengers() {
  const container = document.getElementById('registered-passengers-list');
  if (!container) return;

  try {
    const res = await window.RailwayAPI.getPassengers();
    if (res.success && res.data) {
      if (res.data.length === 0) {
        container.innerHTML = `<p style="color: #64748b; font-size: 0.9rem;">No registered passengers yet.</p>`;
        return;
      }

      container.innerHTML = res.data.slice(-5).reverse().map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #e2e8f0;">
          <div>
            <div style="font-weight: 600; color: #0f172a; font-size: 0.95rem;">${p.name}</div>
            <div style="font-size: 0.8rem; color: #64748b;">
              ID: <strong>${p.passenger_id}</strong> | ${p.gender}, Age ${p.age} | 📱 ${p.phone}
            </div>
          </div>
          <a href="book-ticket.html?passenger_id=${p.passenger_id}" class="btn btn-outline btn-sm">
            Book For ➔
          </a>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading passengers:', err);
  }
}
