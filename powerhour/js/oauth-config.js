/*exported OAuthConfig*/
var OAuthConfig = (function() {
  'use strict';

  /* replace these values with yours obtained in the
  "My Applications" section of the Spotify developer site */
  var clientId = '4a8875631f9145bc846b13c7c4d150e5';
  var redirectUri = 'http://localhost:8000/powerhour/callback.html';

  if (location.href.indexOf('http://auggodoggogames.com/powerhour/') === 0){
    redirectUri = 'http://auggodoggogames.com/powerhour/callback.html';
    console.log("YES");  
    console.log(location.href);  
  }  else if(location.href.indexOf('http://www.auggodoggogames.com/powerhour/') === 0) {
    redirectUri = 'http://www.auggodoggogames.com/powerhour/callback.html';
    console.log("YES");  
    console.log(location.href);  
  }  else{ 
    console.log("NOPE");  
    console.log(location.href);  
  }

  //setTimeout(function(){ 
  var host = /http[s]?:\/\/[^/]+/.exec(redirectUri)[0];

  return {
    clientId: clientId,
    redirectUri: redirectUri,
    host: host,
    stateKey: 'spotify_auth_state'
  };
 // }, 3000);


})();
