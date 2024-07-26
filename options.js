function saveOptions() {
    const hotword = document.getElementById('hotword').value;
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('model').value;
  
    chrome.storage.sync.set({
      hotword: hotword,
      apiKey: apiKey,
      model: model
    }, () => {
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    });
  }
  
  function restoreOptions() {
    chrome.storage.sync.get({
      hotword: '/ai',
      apiKey: '',
      model: 'mixtral-8x7b-32768'
    }, (items) => {
      document.getElementById('hotword').value = items.hotword;
      document.getElementById('apiKey').value = items.apiKey;
      document.getElementById('model').value = items.model;
    });
  }
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);