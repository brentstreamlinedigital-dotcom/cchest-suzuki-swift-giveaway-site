// Live Draw Page Javascript

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const choicesGrid = document.getElementById('choices-grid');
  const drawCards = document.querySelectorAll('.draw-card');
  const resetDrawBtn = document.getElementById('reset-draw-btn');
  const configNamesBtn = document.getElementById('config-names-btn');
  const configNamesModal = document.getElementById('config-names-modal');
  const closeConfig = document.getElementById('close-config');
  const configNamesForm = document.getElementById('config-names-form');
  const saveNamesBtn = document.getElementById('save-names-btn');
  
  const winnerAnnounceOverlay = document.getElementById('winner-announce-overlay');
  const winnerNameDisplay = document.getElementById('winner-name-display');
  const closeWinnerOverlay = document.getElementById('close-winner-overlay');

  // Default Finalists List
  let finalists = [
    "Thabo Ndlovu",
    "Sarah Jenkins",
    "Zolani Maseko",
    "Anika Smit",
    "Moira Pillay",
    "Liam O'Connor",
    "David Burger",
    "Zama Khumalo"
  ];

  // State Variables
  let winningIndex = 0;
  let isGameOver = false;

  // Initialize
  loadFinalistNames();
  shuffleKeyPlacement();

  // Shuffle winning index (0 to 7)
  function shuffleKeyPlacement() {
    winningIndex = Math.floor(Math.random() * 8);
    isGameOver = false;
    
    // Reset DOM cards
    drawCards.forEach((card, index) => {
      card.classList.remove('revealed');
      const badge = card.querySelector('.key-reveal-badge');
      badge.textContent = '...';
      badge.className = 'key-reveal-badge';
      
      const hat = card.querySelector('.hat-graphic-wrapper');
      hat.textContent = '🎩';
    });
  }

  // Load names onto the cards
  function loadFinalistNames() {
    // Attempt load from localStorage
    const saved = localStorage.getItem('ccec-finalists');
    if (saved) {
      try {
        finalists = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved finalists", e);
      }
    }

    // Populate the UI
    drawCards.forEach((card, index) => {
      const label = card.querySelector('.choice-label');
      label.textContent = finalists[index] || `Finalist ${index + 1}`;
    });

    // Populate inputs in configuration modal
    const inputs = document.querySelectorAll('.finalist-input');
    inputs.forEach(input => {
      const idx = parseInt(input.dataset.idx);
      input.value = finalists[idx] || '';
    });
  }

  // Handle Card Click (Key Ceremony Attempt)
  drawCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      // Prevent clicking if card already revealed or if winner already found
      if (card.classList.contains('revealed') || isGameOver) {
        return;
      }

      // Add revealed state to card
      card.classList.add('revealed');
      const badge = card.querySelector('.key-reveal-badge');
      const hat = card.querySelector('.hat-graphic-wrapper');

      // Check if this index is the winning key
      if (index === winningIndex) {
        isGameOver = true;
        badge.textContent = '🔑 Working Key! WINNER!';
        badge.classList.add('winner');
        hat.textContent = '🔑';

        // Wait 1.2s to build tension, then show giant winner overlay
        setTimeout(() => {
          const winnerName = finalists[index] || `Finalist ${index + 1}`;
          winnerNameDisplay.textContent = winnerName;
          winnerAnnounceOverlay.classList.add('active');
        }, 1200);

      } else {
        badge.textContent = '❌ Incorrect Key';
        badge.classList.add('loser');
        hat.textContent = '🚫';
      }
    });
  });

  // Modal Open/Close Events
  configNamesBtn.addEventListener('click', () => {
    configNamesModal.classList.add('active');
  });

  const closeConfigFn = () => {
    configNamesModal.classList.remove('active');
  };
  closeConfig.addEventListener('click', closeConfigFn);

  // Save Finalist Names from form
  configNamesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputs = document.querySelectorAll('.finalist-input');
    inputs.forEach(input => {
      const idx = parseInt(input.dataset.idx);
      finalists[idx] = input.value.trim() || `Finalist ${idx + 1}`;
    });

    // Save to LocalStorage
    localStorage.setItem('ccec-finalists', JSON.stringify(finalists));

    // Reload UI
    loadFinalistNames();
    closeConfigFn();
  });

  // Reset Events
  resetDrawBtn.addEventListener('click', () => {
    shuffleKeyPlacement();
  });

  closeWinnerOverlay.addEventListener('click', () => {
    winnerAnnounceOverlay.classList.remove('active');
    shuffleKeyPlacement();
  });

  // Close modals on clicking overlay background
  window.addEventListener('click', (e) => {
    if (e.target === configNamesModal) {
      configNamesModal.classList.remove('active');
    }
  });
});
