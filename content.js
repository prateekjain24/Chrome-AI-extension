let hotword = '/ai';
let isWaiting = false;
let pendingQuery = null;
let lastEditedElement = null;

function attachListeners(element) {
  element.addEventListener('input', detectInput);
  element.addEventListener('keydown', handleKeyPress);
}

function detectInput(event) {
  const element = event.target;
  lastEditedElement = element;
  const text = element.value || element.textContent;
  if (text.includes(hotword)) {
    const parts = text.split(hotword);
    pendingQuery = parts[parts.length - 1].trim();
  } else {
    pendingQuery = null;
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter' && event.shiftKey && pendingQuery && !isWaiting && lastEditedElement) {
    event.preventDefault();
    event.stopPropagation();
    isWaiting = true;
    showLoadingIndicator(lastEditedElement);
    chrome.runtime.sendMessage({action: "queryGroq", query: pendingQuery}, (response) => {
      if (response && response.result) {
        replaceText(lastEditedElement, response.result);
      } else {
        console.error("Error querying Groq API");
      }
      hideLoadingIndicator();
      isWaiting = false;
      pendingQuery = null;
    });
  }
}

function replaceText(element, newText) {
  const fullText = element.value || element.textContent;
  const hotwordIndex = fullText.lastIndexOf(hotword);
  const beforeHotword = fullText.substring(0, hotwordIndex);
  const afterQuery = fullText.substring(hotwordIndex + hotword.length + pendingQuery.length);
  const updatedText = beforeHotword + newText + afterQuery;

  if (typeof element.value !== 'undefined') {
    element.value = updatedText;
  } else {
    element.textContent = updatedText;
  }

  // Trigger input event to ensure any listeners on the element are notified
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function showLoadingIndicator(element) {
  const indicator = document.createElement('div');
  indicator.textContent = 'AI is thinking...';
  indicator.style.position = 'fixed';
  indicator.style.background = 'rgba(0,0,0,0.7)';
  indicator.style.color = 'white';
  indicator.style.padding = '10px';
  indicator.style.borderRadius = '5px';
  indicator.style.fontSize = '14px';
  indicator.style.zIndex = '10000';
  indicator.style.top = '20px';
  indicator.style.right = '20px';
  
  indicator.id = 'ai-loading-indicator';
  document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
  const indicator = document.getElementById('ai-loading-indicator');
  if (indicator) {
    indicator.remove();
  }
}

function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'TEXTAREA' || (node.tagName === 'INPUT' && node.type === 'text') || node.contentEditable === 'true') {
              attachListeners(node);
            }
            const textareas = node.querySelectorAll('textarea');
            const inputs = node.querySelectorAll('input[type="text"]');
            const editables = node.querySelectorAll('[contenteditable="true"]');
            textareas.forEach(attachListeners);
            inputs.forEach(attachListeners);
            editables.forEach(attachListeners);
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  const textareas = document.querySelectorAll('textarea');
  const inputs = document.querySelectorAll('input[type="text"]');
  const editables = document.querySelectorAll('[contenteditable="true"]');
  textareas.forEach(attachListeners);
  inputs.forEach(attachListeners);
  editables.forEach(attachListeners);
  observeDOM();
});

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