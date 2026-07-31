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

  // Initial UI Update
  updateCheckoutSummary();

  // Increment total ticket counter dynamically just for fun
  let totalEntriesCount = 14820;
  setInterval(() => {
    if (Math.random() > 0.6) {
      totalEntriesCount += Math.floor(Math.random() * 3) + 1;
      if (statsTotalEntries) {
        statsTotalEntries.textContent = totalEntriesCount.toLocaleString();
      }
    }
  }, 5000);

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
  });

  closeCheckout.addEventListener('click', () => {
    checkoutModal.classList.remove('active');
  });

  // Close modals on clicking overlay background
  window.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
      checkoutModal.classList.remove('active');
    }
    if (e.target === successModal) {
      successModal.classList.remove('active');
    }
  });

  // Payment Form Submit (Simulation)
  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Change button status
    submitPaymentBtn.disabled = true;
    submitPaymentBtn.textContent = 'Processing Secure Payment...';

    // Simulate Payment gateway response
    setTimeout(() => {
      // Gather data
      const nameVal = document.getElementById('pay-name').value;
      const emailVal = document.getElementById('pay-email').value;

      // Populate Receipt
      receiptName.textContent = nameVal;
      receiptQty.textContent = `${selectedQty} Entry Ticket${selectedQty > 1 ? 's' : ''}`;
      receiptPrice.textContent = `R${selectedPrice}`;

      // Generate random ticket numbers
      const ticketNums = [];
      for (let i = 0; i < selectedQty; i++) {
        const num = Math.floor(1000 + Math.random() * 9000);
        const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        ticketNums.push(`CC-75${num}-${char}`);
      }
      // Show first 3 tickets, group others as "+ X more"
      if (ticketNums.length <= 3) {
        receiptNumbers.textContent = ticketNums.join(', ');
      } else {
        receiptNumbers.textContent = `${ticketNums.slice(0, 3).join(', ')} ... (+ ${ticketNums.length - 3} more)`;
      }

      // Increment total entries on the site
      totalEntriesCount += selectedQty;
      if (statsTotalEntries) {
        statsTotalEntries.textContent = totalEntriesCount.toLocaleString();
      }

      // Show Success Modal
      checkoutModal.classList.remove('active');
      successModal.classList.add('active');

      // Reset Form and button state
      submitPaymentBtn.disabled = false;
      submitPaymentBtn.textContent = 'Pay Securely Now';
      paymentForm.reset();
    }, 1800);
  });

  // Success Modal close
  const closeSuccessFn = () => {
    successModal.classList.remove('active');
  };
  closeSuccess.addEventListener('click', closeSuccessFn);
  successDoneBtn.addEventListener('click', closeSuccessFn);
});
