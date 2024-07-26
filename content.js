let hotword = '/ai';
let isWaiting = false;
let floatingButton = null;

function createFloatingButton() {
  const button = document.createElement('div');
  button.textContent = 'AI Enhance';
  button.style.position = 'fixed';
  button.style.zIndex = '2147483647';
  button.style.padding = '10px';
  button.style.backgroundColor = '#4285f4';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.fontFamily = 'Arial, sans-serif';
  button.style.fontSize = '14px';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  button.addEventListener('click', handleButtonClick);
  document.body.appendChild(button);
  return button;
}

function handleButtonClick() {
  if (isWaiting) return;

  const activeElement = findActiveElement();
  if (!activeElement) {
    alert('Please focus on a text input field before clicking the AI Enhance button.');
    return;
  }

  let text = getElementText(activeElement);
  let lastIndex = text.lastIndexOf(hotword);
  let query = '';

  if (lastIndex === -1) {
    // Hotword not found, let's add it and prompt for query
    query = prompt(`Enter your query for AI enhancement:`);
    if (!query) return; // User cancelled the prompt
    
    // Insert hotword and query at the end of the current text
    text += (text.length > 0 && !text.endsWith(' ') ? ' ' : '') + hotword + ' ' + query;
    setElementText(activeElement, text);
    lastIndex = text.lastIndexOf(hotword);
  } else {
    query = text.slice(lastIndex + hotword.length).trim();
    if (!query) {
      query = prompt(`Enter your query for AI enhancement:`);
      if (!query) return; // User cancelled the prompt
      
      // Update the text with the new query
      text = text.slice(0, lastIndex + hotword.length) + ' ' + query;
      setElementText(activeElement, text);
    }
  }

  isWaiting = true;
  showLoadingIndicator();

  chrome.runtime.sendMessage({action: "queryGroq", query: query}, (response) => {
    if (response && response.result) {
      replaceText(activeElement, response.result, lastIndex, query.length);
    } else {
      console.error("Error querying Groq API");
      alert('An error occurred while generating the AI response. Please try again.');
    }
    hideLoadingIndicator();
    isWaiting = false;
  });
}

function findActiveElement() {
  // Check for Gmail's compose box
  const gmailComposeBox = document.querySelector('div[role="textbox"][aria-label*="Message Body"], div[contenteditable="true"][aria-label*="Message Body"]');
  if (gmailComposeBox) return gmailComposeBox;

  // Check for Outlook's compose box
  const outlookComposeBox = document.querySelector('[aria-label="Message body"], [contenteditable="true"][role="textbox"]');
  if (outlookComposeBox) return outlookComposeBox;

  // Fallback to document.activeElement
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.isContentEditable || activeElement.tagName === 'TEXTAREA' || (activeElement.tagName === 'INPUT' && activeElement.type === 'text'))) {
    return activeElement;
  }

  return null;
}

function getElementText(element) {
  return element.value || element.textContent || '';
}

function setElementText(element, text) {
  if (element.isContentEditable) {
    element.textContent = text;
  } else if (element.value !== undefined) {
    element.value = text;
  }
  // Trigger input event
  element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

function replaceText(element, newText, startIndex, queryLength) {
  const fullText = getElementText(element);
  const beforeHotword = fullText.substring(0, startIndex);
  const afterQuery = fullText.substring(startIndex + hotword.length + queryLength);
  const updatedText = beforeHotword + newText + afterQuery;

  setElementText(element, updatedText);

  // For contenteditable elements, we need to manually move the cursor
  if (element.isContentEditable) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(element.childNodes[0], updatedText.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
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
  indicator.style.zIndex = '2147483647';
  indicator.style.fontFamily = 'Arial, sans-serif';
  indicator.style.fontSize = '14px';
  indicator.id = 'ai-loading-indicator';
  document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
  const indicator = document.getElementById('ai-loading-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// Create floating button when the content script loads
floatingButton = createFloatingButton();

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