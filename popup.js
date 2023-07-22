document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.querySelector('#submit');
  const supportLink = document.querySelector('.support-link');
  const messageBox = document.getElementById('messageBox'); // Get the message box element
  const copyTokenButton = document.querySelector('#copy-token-button');
   messageBox.style.display = 'none';
   copyTokenButton.classList.add('disabled');

function checkCorrectTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        const currentUrl = activeTab.url;
        if (!currentUrl || !currentUrl.includes('https://discord.com')) {
            showMessage('Please navigate to discord.com/login to use this extension.', true, messageBox);
            return;
        } 
    });
}
checkCorrectTab();

  submitButton.addEventListener('click', () => {
      const tokenInput = document.querySelector('#token');
      const token = tokenInput.value;

      if (token === '') {
          tokenInput.style.border = '1px solid #ee4445';
          showMessage('Please enter your Discord token.', true, messageBox);
      } else {
          tokenInput.style.border = '1px solid #222428';
          // showMessage('', false, messageBox); // Hide the message box
          verifyToken(token, tokenInput, messageBox); // Call the token verification function
      }
  });

  if (supportLink) {
      supportLink.addEventListener('click', () => {
          chrome.tabs.create({ url: 'https://discord.gg/48qbg6UP9g' });
      });
  }
});

// Functions

function verifyToken(token, tokenInput, messageBox) {
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
          showMessage('Success!', false, messageBox);
      } else {
          // Token is invalid
          console.log('Token is invalid');
          tokenInput.style.border = '1px solid #ee4445';
          showMessage('Invalid token. Please check your Discord token.', true, messageBox);
      }
  })
  .catch((error) => {
      // Error occurred during token verification
      console.error('Error occurred:', error);
      showMessage('An error occurred during token verification.', true, messageBox);
  });
}

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

function showMessage(message, isError, element) {
  element.textContent = message;
  element.style.display = 'block';
  element.style.backgroundColor = isError ? '#ee4445' : '#00ff15';
  if (isError) {
    createCloseButton(element);
  } else {
    createCloseButton(element);
  }

  setTimeout(() => {
    element.style.display = 'none';
  }, 5000); 
}

function createCloseButton(element) {
  const closeButton = document.createElement('span');
  closeButton.className = 'close-button';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => {
      element.style.display = 'none';
  });
  element.appendChild(closeButton);
}

