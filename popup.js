document.addEventListener('DOMContentLoaded', () => {
    const currentHotwordSpan = document.getElementById('currentHotword');
    const optionsButton = document.getElementById('optionsButton');
  
    // Display current hotword
    chrome.storage.sync.get('hotword', (data) => {
      currentHotwordSpan.textContent = data.hotword || '/ai';
    });
  
    // Open options page when button is clicked
    optionsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  });