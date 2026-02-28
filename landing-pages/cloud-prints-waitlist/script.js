/**
 * Cloud Prints Waitlist Landing Page
 * Form validation and submission handling
 */

(function() {
  'use strict';

  const form = document.getElementById('signup-form');
  const successMessage = document.getElementById('signup-success');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');

  if (!form || !successMessage) return;

  /**
   * Validate email format
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Show error message for an input
   */
  function showError(input, message) {
    clearError(input);
    input.classList.add('error');

    const errorEl = document.createElement('p');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    errorEl.setAttribute('role', 'alert');

    input.parentNode.appendChild(errorEl);
  }

  /**
   * Clear error message for an input
   */
  function clearError(input) {
    input.classList.remove('error');
    const existing = input.parentNode.querySelector('.form-error');
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Validate form inputs
   */
  function validateForm() {
    let isValid = true;

    // Validate name
    const name = nameInput.value.trim();
    if (!name) {
      showError(nameInput, 'Please enter your name');
      isValid = false;
    } else {
      clearError(nameInput);
    }

    // Validate email
    const email = emailInput.value.trim();
    if (!email) {
      showError(emailInput, 'Please enter your email');
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError(emailInput, 'Please enter a valid email');
      isValid = false;
    } else {
      clearError(emailInput);
    }

    return isValid;
  }

  /**
   * Set loading state on button
   */
  function setLoading(button, loading) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  /**
   * Show success state
   */
  function showSuccess() {
    form.hidden = true;
    successMessage.hidden = false;
    successMessage.focus();
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    setLoading(submitBtn, true);

    const formData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      source: 'cloud-prints-waitlist',
      timestamp: new Date().toISOString()
    };

    // Simulate API call (replace with actual endpoint)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Log submission for demo purposes
      console.log('Form submitted:', formData);

      // Store in localStorage as backup
      const submissions = JSON.parse(localStorage.getItem('waitlist-submissions') || '[]');
      submissions.push(formData);
      localStorage.setItem('waitlist-submissions', JSON.stringify(submissions));

      showSuccess();
    } catch (error) {
      console.error('Submission error:', error);
      setLoading(submitBtn, false);
      alert('Something went wrong. Please try again.');
    }
  }

  /**
   * Clear errors on input
   */
  function handleInput(e) {
    clearError(e.target);
  }

  // Event listeners
  form.addEventListener('submit', handleSubmit);
  nameInput.addEventListener('input', handleInput);
  emailInput.addEventListener('input', handleInput);

  // Clear errors on blur if valid
  nameInput.addEventListener('blur', function() {
    if (this.value.trim()) clearError(this);
  });

  emailInput.addEventListener('blur', function() {
    const email = this.value.trim();
    if (email && isValidEmail(email)) clearError(this);
  });
})();
