chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "queryGroq") {
      chrome.storage.sync.get(['apiKey', 'model'], (data) => {
        const apiKey = data.apiKey;
        const model = data.model;
        const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  
        if (!apiKey) {
          sendResponse({error: "API key not set. Please set it in the options page."});
          return;
        }
  
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "user",
                content: request.query
              }
            ]
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.choices && data.choices.length > 0) {
            sendResponse({result: data.choices[0].message.content.trim()});
          } else {
            sendResponse({error: "No response from API"});
          }
        })
        .catch(error => {
          console.error('Error:', error);
          sendResponse({error: "API request failed"});
        });
      });
  
      return true; // Indicates that the response will be sent asynchronously
    }
  });