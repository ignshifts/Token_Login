if (document.querySelector('.discord-token-login-popup')) {
    document.querySelector('#submit').addEventListener('click', () => {
        token = document.querySelector('#token').value;

        if (token != '') {
            document.querySelector('#token').style.border = '1px solid #222428';
        }
            fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  })
  .then(response => {
    if (response.ok) {
      // Token is valid
      console.log('Token is valid');
      document.querySelector('#token').style.border = '1px solid #00ff15';

      chrome.tabs.executeScript(null, {
        code: `token = '${token}';`
    }, () => chrome.tabs.executeScript(null, {file: 'console.js'}));


      token = '';

    } else {
      // Token is invalid
      console.log('Token is invalid');
      document.querySelector('#token').style.border = '1px solid #ee4445';
      // Change the login button color to red to indicate an invalid token
    }
  })
  .catch(error => {
    // Error occurred during token verification
    console.error('Error occurred:', error);
  });

}
    );
}

