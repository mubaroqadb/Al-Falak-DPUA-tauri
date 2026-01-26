// Tab Manager for Results Panel
// Handles switching between tabs in the results display

export function initializeTabManager() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));

      // Remove active class from all contents
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button
      button.classList.add('active');

      // Add active class to corresponding content
      const activeContent = document.getElementById(tabName);
      if (activeContent) {
        activeContent.classList.add('active');
      }

      console.log(`📑 Switched to tab: ${tabName}`);
    });
  });

  // Set first tab as active by default
  if (tabButtons.length > 0) {
    tabButtons[0].classList.add('active');
  }
  if (tabContents.length > 0) {
    tabContents[0].classList.add('active');
  }
}
