// Main Landing Page Javascript

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const bundleCards = document.querySelectorAll('.bundle-card');
  const customQtyRow = document.getElementById('custom-qty-row');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');
  const qtyValue = document.getElementById('qty-value');

  const summaryPackageName = document.getElementById('summary-package-name');
  const summaryTicketCount = document.getElementById('summary-ticket-count');
  const summaryDiscountRow = document.getElementById('summary-discount-row');
  const summaryDiscountVal = document.getElementById('summary-discount-val');
  const summaryTotalPrice = document.getElementById('summary-total-price');

  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckout = document.getElementById('close-checkout');
  const modalTicketsLabel = document.getElementById('modal-tickets-label');
  const modalCostLabel = document.getElementById('modal-cost-label');

  const paymentForm = document.getElementById('payment-form');
  const submitPaymentBtn = document.getElementById('submit-payment-btn');

  const successModal = document.getElementById('success-modal');
  const closeSuccess = document.getElementById('close-success');
  const successDoneBtn = document.getElementById('success-done-btn');

  const receiptName = document.getElementById('receipt-name');
  const receiptQty = document.getElementById('receipt-qty');
  const receiptNumbers = document.getElementById('receipt-numbers');
  const receiptPrice = document.getElementById('receipt-price');

  const statsTotalEntries = document.getElementById('stats-total-entries');

  // State Variables
  let currentSelectionType = 'bundle'; // 'bundle' or 'custom'
  let selectedQty = 1;
  let selectedPrice = 100;
  let selectedName = 'Single Entry';
  let customQty = 1;

  // Smooth scroll handler for anchor links (ensures iframe compatibility in Framer)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Initial UI Update
  updateCheckoutSummary();

  // Check if we just returned from a successful Payfast payment
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('payment') === 'success') {
    const nameVal = urlParams.get('name');
    const qtyVal = parseInt(urlParams.get('qty')) || 0;
    const priceVal = urlParams.get('price');
    const ticketsVal = urlParams.get('tickets') || '';

    // Populate Receipt Modal
    if (receiptName) receiptName.textContent = nameVal;
    if (receiptQty) receiptQty.textContent = `${qtyVal} Entry Ticket${qtyVal > 1 ? 's' : ''}`;
    if (receiptPrice) receiptPrice.textContent = `R${priceVal}`;

    if (receiptNumbers && ticketsVal) {
      const ticketNums = ticketsVal.split(',');
      if (ticketNums.length <= 3) {
        receiptNumbers.textContent = ticketNums.join(', ');
      } else {
        receiptNumbers.textContent = `${ticketNums.slice(0, 3).join(', ')} ... (+ ${ticketNums.length - 3} more)`;
      }
    }

    // Show Success Modal
    if (successModal) {
      successModal.classList.add('active');
    }

    // Clean up URL query parameters so refreshing doesn't keep showing the modal
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Fetch genuine ticket counter from Google Sheets API (Base count: 30)
  async function loadGenuineTicketCount() {
    if (!statsTotalEntries) return;

    const MIN_BASE_COUNT = 30;

    try {
      const response = await fetch('/api/tickets-count');
      if (!response.ok) throw new Error('Tickets count response not OK');

      const data = await response.json();
      if (data && typeof data.count === 'number') {
        const finalCount = Math.max(MIN_BASE_COUNT, data.count);
        animateCounter(statsTotalEntries, finalCount);
      } else {
        animateCounter(statsTotalEntries, MIN_BASE_COUNT);
      }
    } catch (err) {
      console.warn('Could not fetch live ticket count, defaulting to base 30:', err);
      animateCounter(statsTotalEntries, MIN_BASE_COUNT);
    }
  }

  // Smooth counter animation function
  function animateCounter(element, target) {
    const finalTarget = Math.max(30, target || 0);

    const duration = 1500;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(finalTarget * easeProgress);

      element.textContent = currentVal.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = finalTarget.toLocaleString();
      }
    }

    requestAnimationFrame(step);
  }

  loadGenuineTicketCount();

  // Bundle selection event
  bundleCards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove active from all bundles
      bundleCards.forEach(c => c.classList.remove('active'));
      customQtyRow.classList.remove('active');

      card.classList.add('active');
      currentSelectionType = 'bundle';
      selectedQty = parseInt(card.dataset.qty);
      selectedPrice = parseInt(card.dataset.price);
      selectedName = card.querySelector('.bundle-name').textContent;

      updateCheckoutSummary();
    });
  });

  // Custom Qty events
  customQtyRow.addEventListener('click', (e) => {
    // If clicking the buttons, don't trigger the row click if we're already custom
    if (currentSelectionType === 'custom' && (e.target.classList.contains('qty-btn') || e.target.id === 'qty-minus' || e.target.id === 'qty-plus')) {
      return;
    }

    bundleCards.forEach(c => c.classList.remove('active'));
    customQtyRow.classList.add('active');
    currentSelectionType = 'custom';
    selectedName = 'Custom Ticket Package';
    selectedQty = customQty;
    selectedPrice = customQty * 100;

    updateCheckoutSummary();
  });

  qtyMinus.addEventListener('click', (e) => {
    e.stopPropagation();
    if (customQty > 1) {
      customQty--;
      qtyValue.textContent = customQty;
      if (currentSelectionType === 'custom') {
        selectedQty = customQty;
        selectedPrice = customQty * 100;
        updateCheckoutSummary();
      }
    }
  });

  qtyPlus.addEventListener('click', (e) => {
    e.stopPropagation();
    customQty++;
    qtyValue.textContent = customQty;
    if (currentSelectionType === 'custom') {
      selectedQty = customQty;
      selectedPrice = customQty * 100;
      updateCheckoutSummary();
    }
  });

  // Update Summary DOM
  function updateCheckoutSummary() {
    summaryPackageName.textContent = selectedName;
    summaryTicketCount.textContent = `${selectedQty} Ticket${selectedQty > 1 ? 's' : ''}`;
    summaryTotalPrice.textContent = `R${selectedPrice}`;

    // Calculate discount for standard bundles compared to custom R100/ticket
    const regularCost = selectedQty * 100;
    const discount = regularCost - selectedPrice;

    if (discount > 0) {
      summaryDiscountRow.style.display = 'flex';
      summaryDiscountVal.textContent = `-R${discount}`;
    } else {
      summaryDiscountRow.style.display = 'none';
    }
  }

  // Checkout Modal triggers
  checkoutBtn.addEventListener('click', () => {
    modalTicketsLabel.textContent = `${selectedQty} Ticket${selectedQty > 1 ? 's' : ''}`;
    modalCostLabel.textContent = `R${selectedPrice}`;
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  });

  closeCheckout.addEventListener('click', () => {
    checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Terms and Conditions Elements
  const termsModal = document.getElementById('terms-modal');
  const openTermsBtn = document.getElementById('open-terms-btn');
  const footerTermsLink = document.getElementById('footer-terms-link');
  const closeTerms = document.getElementById('close-terms');
  const acceptTermsModalBtn = document.getElementById('accept-terms-modal-btn');
  const acceptTermsCheckbox = document.getElementById('accept-terms');

  const openTerms = (e) => {
    if (e) e.preventDefault();
    if (termsModal) {
      termsModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeTermsFn = () => {
    if (termsModal) {
      termsModal.classList.remove('active');
      // If checkout modal is still active, keep overflow hidden
      if (!checkoutModal.classList.contains('active')) {
        document.body.style.overflow = '';
      }
    }
  };

  if (openTermsBtn) openTermsBtn.addEventListener('click', openTerms);
  if (footerTermsLink) footerTermsLink.addEventListener('click', openTerms);
  if (closeTerms) closeTerms.addEventListener('click', closeTermsFn);

  if (acceptTermsModalBtn) {
    acceptTermsModalBtn.addEventListener('click', () => {
      if (acceptTermsCheckbox) {
        acceptTermsCheckbox.checked = true;
      }
      closeTermsFn();
    });
  }

  // Payment Form Submit (Payfast integration)
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (acceptTermsCheckbox && !acceptTermsCheckbox.checked) {
      alert('Please read and accept the terms and conditions to proceed.');
      acceptTermsCheckbox.focus();
      return;
    }

    // Change button status
    submitPaymentBtn.disabled = true;
    submitPaymentBtn.textContent = 'Redirecting to Secure PayFast...';

    // Gather data
    const nameVal = document.getElementById('pay-name').value;
    const emailVal = document.getElementById('pay-email').value;
    const phoneVal = document.getElementById('pay-phone').value;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          phone: phoneVal,
          qty: selectedQty,
          price: selectedPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate secure checkout session');
      }

      const checkoutData = await response.json();

      if (checkoutData.success) {
        // Populate Receipt Modal directly
        if (receiptName) receiptName.textContent = checkoutData.name;
        if (receiptQty) receiptQty.textContent = `${checkoutData.qty} Entry Ticket${checkoutData.qty > 1 ? 's' : ''}`;
        if (receiptPrice) receiptPrice.textContent = `R${checkoutData.price}`;

        if (receiptNumbers && checkoutData.tickets) {
          const ticketNums = checkoutData.tickets.split(',');
          if (ticketNums.length <= 3) {
            receiptNumbers.textContent = ticketNums.join(', ');
          } else {
            receiptNumbers.textContent = `${ticketNums.slice(0, 3).join(', ')} ... (+ ${ticketNums.length - 3} more)`;
          }
        }

        // Show Success Modal
        checkoutModal.classList.remove('active');
        successModal.classList.add('active');
        paymentForm.reset();
        
        submitPaymentBtn.disabled = false;
        submitPaymentBtn.textContent = 'Proceed to Secure PayFast Payment →';
        return;
      }

      // Dynamically create a form and submit it to redirect to Payfast
      // target="_blank" ensures PayFast opens in a new tab, breaking out of
      // any parent iframe (e.g. Framer embed) that would block PayFast's anti-iframe policy
      const payfastForm = document.createElement('form');
      payfastForm.method = 'POST';
      payfastForm.action = checkoutData.url;
      payfastForm.target = '_blank';

      Object.keys(checkoutData.fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = checkoutData.fields[key];
        payfastForm.appendChild(input);
      });

      document.body.appendChild(payfastForm);
      payfastForm.submit();
      document.body.removeChild(payfastForm);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error initiating checkout. Please try again.');
      submitPaymentBtn.disabled = false;
      submitPaymentBtn.textContent = 'Proceed to Secure PayFast Payment →';
    }
  });

  // Success Modal close
  const closeSuccessFn = () => {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  };
  closeSuccess.addEventListener('click', closeSuccessFn);
  successDoneBtn.addEventListener('click', closeSuccessFn);

  // Close modals when clicking the dark overlay backdrop
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  if (termsModal) {
    termsModal.addEventListener('click', (e) => {
      if (e.target === termsModal) {
        closeTermsFn();
      }
    });
  }

  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Gallery Lightbox Lightbox Preview
  const galleryLightbox = document.getElementById('gallery-lightbox');
  const galleryTarget = document.getElementById('gallery-modal-target');
  const galleryThumbs = document.querySelectorAll('.gallery-thumb-card');

  if (galleryLightbox && galleryTarget && galleryThumbs.length > 0) {
    galleryThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const imgSrc = thumb.getAttribute('data-img');
        if (imgSrc) {
          galleryTarget.src = imgSrc;
          galleryLightbox.classList.add('active');
        }
      });
    });

    galleryLightbox.addEventListener('click', () => {
      galleryLightbox.classList.remove('active');
    });
  }
});


