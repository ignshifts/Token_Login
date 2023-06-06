let token = document.querySelector('#token').value;
  
  // Verify token validity
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
 
      localStorage.setItem('token', `"${token.replace('"', '')}"`);
         window.location.replace('https://discord.com/channels/@me');

      token = '';
      // Change the login button color to green to indicate a valid token

      document.querySelector('#token').style.border = '1px solid ##00ff15';
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



