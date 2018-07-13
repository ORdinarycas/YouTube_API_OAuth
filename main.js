// Options
const CLIENT_ID = '631647496754-kbbljjnhqgqca6j50rd6apckqo99ja85.apps.googleusercontent.com';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');

const defaultChannel = 'techguyweb';

// Form submit and change channel
channelForm.addEventListener('submit', e =>{
  e.preventDefault();

  const channel = channelInput.value;
  getChannel(channel);
});

// Load auth2 library
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

//Initializes the API client library and sets up sign-in state listeners.
function initClient() {
  gapi.client.init({
    discoveryDocs: DISCOVERY_DOCS,
    clientId: CLIENT_ID,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    content.style.display = 'block';
    videoContainer.style.display = 'block';
    getChannel(defaultChannel);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    content.style.display = 'none';
    videoContainer.style.display = 'none';
  }
}
// Sign in the user upon button click.
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}
// Sign out the user upon button click.
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

// Display channel data
function showChannelData(data){
  const channelData = document.getElementById('channel-data');
  channelData.innerHTML = data;
}

// Get channel from API
function getChannel(channel) {
  gapi.client.youtube.channels
  .list({
    part: 'snippet,contentDetails,statistics',
    forUsername: channel
  })
  .then(response => {
    console.log(response);
    const channel = response.result.items[0];
    const output = `
      <ul class="collection">
        <li class="collection-item">Title: ${channel.snippet.title}</li>
        <li class="collection-item">ID: ${channel.id}</li>
        <li class="collection-item">Subscribers: ${numberWithCommas(channel.statistics.subscriberCount)}</li>
        <li class="collection-item">Views: ${numberWithCommas(channel.statistics.viewCount)}</li>
        <li class="collection-item">Videos: ${numberWithCommas(channel.statistics.videoCount)}</li>
      </ul>
      <p>${channel.snippet.description}</p>
      <hr>
      <a class="btn grey darken-2" target="_blank"  href="//www.youtube.com/${channel.snippet.customUrl}">Visit Channel</a>
    `;
    showChannelData(output);

    const playlistId = channel.contentDetails.relatedPlaylists.uploads;
    requestVideoPlaylist(playlistId);
  })
  .catch(err => alert('No Channel By That Name'));
  // .then(function(response) {
  //   var channel = response.result.items[0];
  //   appendPre('This channel\'s ID is ' + channel.id + '. ' +
  //             'Its title is \'' + channel.snippet.title + ', ' +
  //             'and it has ' + channel.statistics.viewCount + ' views.');
  // });
}

// Add commas to number
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function requestVideoPlaylist(playlistId) {
  const requestOptions = {
    playlistId : playlistId,
    part : 'snippet',
    maxResults: 12
  }
  const request = gapi.client.youtube.playlistItems.list(requestOptions);
  request.execute(response => {
    console.log(response);
    const playlistItems = response.result.items;
    if (playlistItems) {
      let output = '<h4 class="center-align">Latest Videos</h4>';
      // Loop through videos and append output
      playlistItems.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;
        output += `
        <div class="col s3">
          <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        </div>
        `;
      });
      // Output videos
      videoContainer.innerHTML = output;
    }else{
      videoContainer.innerHTML = 'No Uploaded Videos';
    }
  });
}

/*
  參考資料
  https://developers.google.com/youtube/v3/quickstart/js
*/