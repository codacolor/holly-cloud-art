/**
 * Holly Di Cecco - Cloud Art Landing Page
 * Main JavaScript
 *
 * Features:
 * - Smooth scrolling for anchor links
 * - Parallax effect on hero image
 * - Intersection Observer for scroll animations
 * - Lightbox for gallery images
 * - Form handling with validation
 * - Mobile navigation toggle
 * - Testimonial carousel
 */

(function() {
  'use strict';

  // ==========================================================================
  // Configuration
  // ==========================================================================

  const CONFIG = {
    parallaxSpeed: 0.3,
    animationThreshold: 0.15,
    testimonialInterval: 6000,
    scrollOffset: 80, // Account for fixed header
  };

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Debounce function for performance optimization
   */
  function debounce(func, wait = 10) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Smooth easing function for custom animations
   */
  function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  // ==========================================================================
  // Mobile Navigation
  // ==========================================================================

  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // Smooth Scrolling
  // ==========================================================================

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - CONFIG.scrollOffset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without scrolling
        history.pushState(null, null, targetId);
      });
    });
  }

  // ==========================================================================
  // Parallax Effect
  // ==========================================================================

  function initParallax() {
    const heroImage = document.querySelector('.hero-image');
    if (!heroImage) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.pageYOffset;
      const heroHeight = document.querySelector('.hero').offsetHeight;

      // Only apply parallax when hero is visible
      if (scrollY < heroHeight) {
        const yPos = scrollY * CONFIG.parallaxSpeed;
        heroImage.style.transform = `translateY(${yPos}px)`;
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // Scroll Animations (Intersection Observer)
  // ==========================================================================

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
      '.process-step, .gallery-item, .value-prop-content, .value-prop-image, .about-content, .about-image'
    );

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: CONFIG.animationThreshold,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    animatedElements.forEach(el => observer.observe(el));
  }

  // ==========================================================================
  // Testimonial Carousel
  // ==========================================================================

  function initTestimonialCarousel() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.testimonial-dot');

    if (!testimonials.length || !dots.length) return;

    let currentIndex = 0;
    let intervalId;

    function showTestimonial(index) {
      testimonials.forEach((t, i) => {
        t.classList.toggle('active', i === index);
      });
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
        d.setAttribute('aria-selected', i === index);
      });
      currentIndex = index;
    }

    function nextTestimonial() {
      const next = (currentIndex + 1) % testimonials.length;
      showTestimonial(next);
    }

    function startAutoplay() {
      intervalId = setInterval(nextTestimonial, CONFIG.testimonialInterval);
    }

    function stopAutoplay() {
      clearInterval(intervalId);
    }

    // Dot click handlers
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        stopAutoplay();
        showTestimonial(index);
        startAutoplay();
      });
    });

    // Pause on hover
    const carousel = document.querySelector('.testimonial-carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', stopAutoplay);
      carousel.addEventListener('mouseleave', startAutoplay);
    }

    startAutoplay();
  }

  // ==========================================================================
  // Lightbox
  // ==========================================================================

  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = lightbox?.querySelector('.lightbox-image');
    const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
    const closeBtn = lightbox?.querySelector('.lightbox-close');
    const prevBtn = lightbox?.querySelector('.lightbox-prev');
    const nextBtn = lightbox?.querySelector('.lightbox-next');

    const galleryItems = document.querySelectorAll('.gallery-item');

    if (!lightbox || !galleryItems.length) return;

    let currentIndex = 0;
    const items = Array.from(galleryItems);

    function openLightbox(index) {
      currentIndex = index;
      const item = items[index];
      const placeholder = item.querySelector('.gallery-image-placeholder');
      const title = item.querySelector('.gallery-caption-title')?.textContent || '';
      const detail = item.querySelector('.gallery-caption-detail')?.textContent || '';

      // For demo purposes, create a colored placeholder image
      // TODO: Replace with actual image sources when available
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      // Get the computed background of the placeholder
      const computedStyle = window.getComputedStyle(placeholder);
      const bgImage = computedStyle.backgroundImage;

      // Create a gradient fill for the lightbox placeholder
      const gradient = ctx.createLinearGradient(0, 0, 800, 600);
      gradient.addColorStop(0, '#d8e0e8');
      gradient.addColorStop(0.5, '#c8d4e0');
      gradient.addColorStop(1, '#b8c8d8');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);

      // Add title text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '300 48px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 400, 300);

      ctx.font = '300 18px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(detail, 400, 350);

      lightboxImage.src = canvas.toDataURL();
      lightboxImage.alt = title;
      lightboxCaption.textContent = `${title} — ${detail}`;

      lightbox.hidden = false;
      // Force reflow for animation
      lightbox.offsetHeight;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';

      // Wait for animation to complete
      setTimeout(() => {
        lightbox.hidden = true;
      }, 400);
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      openLightbox(currentIndex);
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % items.length;
      openLightbox(currentIndex);
    }

    // Event listeners
    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index));
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(index);
        }
      });
    });

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', showPrev);
    nextBtn?.addEventListener('click', showNext);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          showPrev();
          break;
        case 'ArrowRight':
          showNext();
          break;
      }
    });

    // Close on backdrop click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // ==========================================================================
  // Form Handling
  // ==========================================================================

  function initFormHandling() {
    const form = document.getElementById('waitlist-form');
    const successMessage = document.getElementById('waitlist-success');

    if (!form || !successMessage) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);

      // Build data object
      const data = {
        firstName: formData.get('firstName'),
        email: formData.get('email'),
        interest: formData.get('interest') || null,
        source: 'cloud-art-landing',
        timestamp: new Date().toISOString()
      };

      // Validate
      if (!data.firstName || !data.email) {
        alert('Please fill in all required fields.');
        return;
      }

      if (!isValidEmail(data.email)) {
        alert('Please enter a valid email address.');
        return;
      }

      // Show loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        const response = await fetch('/.netlify/functions/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.firstName,
            email: data.email,
          })
        });
        if (!response.ok) throw new Error('Submission failed');
      } catch (error) {
        alert('Something went wrong. Please try again.');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
      }

      // Show success state
      form.style.display = 'none';
      successMessage.hidden = false;

      // Reset button state (for if form is shown again)
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    });
  }

  /**
   * Simple email validation
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ==========================================================================
  // Header Scroll Effect
  // ==========================================================================

  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;
    const scrollThreshold = 100;

    window.addEventListener('scroll', debounce(() => {
      const currentScroll = window.pageYOffset;

      // Add shadow when scrolled
      if (currentScroll > 10) {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
      } else {
        header.style.boxShadow = 'none';
      }

      lastScroll = currentScroll;
    }, 10), { passive: true });
  }

  // ==========================================================================
  // Prefers Reduced Motion
  // ==========================================================================

  function checkReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Disable parallax
      const heroImage = document.querySelector('.hero-image');
      if (heroImage) {
        heroImage.style.transform = 'none';
      }

      // Disable marquee animation
      document.querySelectorAll('.marquee-content').forEach(el => {
        el.style.animation = 'none';
      });

      // Show all animated elements immediately
      document.querySelectorAll('.process-step, .gallery-item').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    }

    return prefersReducedMotion;
  }

  // ==========================================================================
  // Initialize
  // ==========================================================================

  function init() {
    const reducedMotion = checkReducedMotion();

    initMobileNav();
    initSmoothScroll();
    initHeaderScroll();
    initFormHandling();
    initTestimonialCarousel();
    initLightbox();

    if (!reducedMotion) {
      initParallax();
      initScrollAnimations();
    }

    // Remove no-js class if present
    document.documentElement.classList.remove('no-js');

    console.log('Holly Di Cecco - Cloud Art Landing Page initialized');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
