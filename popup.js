document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.querySelector('#submit');
  
    submitButton.addEventListener('click', () => {
      const tokenInput = document.querySelector('#token');
      const token = tokenInput.value;
  
      if (token == '') {
        tokenInput.style.border = '1px solid #ee4445';
      }
  
      if (token !== '') {
        tokenInput.style.border = '1px solid #222428';
  
        fetch('https://discord.com/api/v10/users/@me', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
        })
          .then((response) => {
            if (response.ok) {
              // Token is valid
              console.log('Token is valid');
              tokenInput.style.border = '1px solid #00ff15';
              saveTokenToStorage(token); // Save the token to storage
            } else {
              // Token is invalid
              console.log('Token is invalid');
              tokenInput.style.border = '1px solid #ee4445';
              // Change the login button color to red to indicate an invalid token
            }
          })
          .catch((error) => {
            // Error occurred during token verification
            console.error('Error occurred:', error);
          });
      }
    });
  });
  
  function saveTokenToStorage(token) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          function: saveToken,
          args: [token],
        },
        () => {
          console.log('Token saved to local storage');
        }
      );
    });
  }
  
  function saveToken(token) {
    localStorage.setItem('token', JSON.stringify(token));
    window.location.replace('https://discord.com/channels/@me');
  }
  
  
