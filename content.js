let hotword = '/ai';
let isWaiting = false;

function detectInput(event) {
  const element = event.target;
  if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && element.type === 'text')) {
    const text = element.value;
    if (text.startsWith(hotword) && !isWaiting) {
      const query = text.slice(hotword.length).trim();
      if (query) {
        isWaiting = true;
        showLoadingIndicator(element);
        chrome.runtime.sendMessage({action: "queryGroq", query: query}, (response) => {
          if (response && response.result) {
            element.value = response.result;
          } else {
            console.error("Error querying Groq API");
          }
          hideLoadingIndicator(element);
          isWaiting = false;
        });
      }
    }
  }
}

function showLoadingIndicator(element) {
  const indicator = document.createElement('div');
  indicator.textContent = 'Loading...';
  indicator.style.position = 'absolute';
  indicator.style.background = 'rgba(0,0,0,0.7)';
  indicator.style.color = 'white';
  indicator.style.padding = '5px';
  indicator.style.borderRadius = '3px';
  indicator.style.fontSize = '12px';
  indicator.style.zIndex = '10000';
  
  const rect = element.getBoundingClientRect();
  indicator.style.top = `${rect.bottom + window.scrollY + 5}px`;
  indicator.style.left = `${rect.left + window.scrollX}px`;
  
  indicator.id = 'ai-loading-indicator';
  document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
  const indicator = document.getElementById('ai-loading-indicator');
  if (indicator) {
    indicator.remove();
  }
}

document.addEventListener('input', detectInput);

// Listen for hotword updates from the options page
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.hotword) {
    hotword = changes.hotword.newValue;
  }
});

// Initialize hotword from storage
chrome.storage.sync.get('hotword', (data) => {
  if (data.hotword) {
    hotword = data.hotword;
  }
});