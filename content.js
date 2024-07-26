let hotword = '/ai';
let isWaiting = false;
let buffer = '';
let floatingButton = null;
let targetElement = null;

function createFloatingButton() {
  const button = document.createElement('button');
  button.textContent = 'AI Enhance';
  button.style.position = 'fixed';
  button.style.zIndex = '10000';
  button.style.padding = '10px';
  button.style.backgroundColor = '#4285f4';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.display = 'none';
  button.addEventListener('click', handleButtonClick);
  document.body.appendChild(button);
  return button;
}

function showFloatingButton(x, y) {
  if (!floatingButton) {
    floatingButton = createFloatingButton();
  }
  floatingButton.style.left = `${x}px`;
  floatingButton.style.top = `${y}px`;
  floatingButton.style.display = 'block';
}

function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.style.display = 'none';
  }
}

function handleKeydown(event) {
  if (event.key === 'Backspace') {
    buffer = buffer.slice(0, -1);
  } else if (event.key.length === 1) {
    buffer += event.key;
  }

  buffer = buffer.slice(-10);  // Keep only the last 10 characters

  if (buffer.includes(hotword)) {
    targetElement = event.target;
    const rect = targetElement.getBoundingClientRect();
    showFloatingButton(rect.right, rect.bottom + window.scrollY);
  } else {
    hideFloatingButton();
  }
}

function handleButtonClick() {
  if (isWaiting || !targetElement) return;

  const text = targetElement.value || targetElement.textContent;
  const parts = text.split(hotword);
  const query = parts[parts.length - 1].trim();

  if (!query) return;

  isWaiting = true;
  hideFloatingButton();
  showLoadingIndicator();

  chrome.runtime.sendMessage({action: "queryGroq", query: query}, (response) => {
    if (response && response.result) {
      replaceText(targetElement, response.result, query);
    } else {
      console.error("Error querying Groq API");
    }
    hideLoadingIndicator();
    isWaiting = false;
  });
}

function replaceText(element, newText, query) {
  const fullText = element.value || element.textContent;
  const hotwordIndex = fullText.lastIndexOf(hotword);
  const beforeHotword = fullText.substring(0, hotwordIndex);
  const afterQuery = fullText.substring(hotwordIndex + hotword.length + query.length);
  const updatedText = beforeHotword + newText + afterQuery;

  if (typeof element.value !== 'undefined') {
    element.value = updatedText;
  } else {
    element.textContent = updatedText;
  }

  // Trigger input event to ensure any listeners on the element are notified
  element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

function showLoadingIndicator() {
  const indicator = document.createElement('div');
  indicator.textContent = 'AI is thinking...';
  indicator.style.position = 'fixed';
  indicator.style.top = '20px';
  indicator.style.right = '20px';
  indicator.style.background = 'rgba(0,0,0,0.7)';
  indicator.style.color = 'white';
  indicator.style.padding = '10px';
  indicator.style.borderRadius = '5px';
  indicator.style.zIndex = '10001';
  indicator.id = 'ai-loading-indicator';
  document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
  const indicator = document.getElementById('ai-loading-indicator');
  if (indicator) {
    indicator.remove();
  }
}

document.addEventListener('keydown', handleKeydown);

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