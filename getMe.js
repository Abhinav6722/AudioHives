const fs = require('fs')
const { searchYouTube, downloadYouTubeVideo } = require('./youtube');
const SpotifyWebApi = require('spotify-web-api-node');
const token = "BQCJQkqyB0H0e8HJ_ftd2cBDul7-Iq-6zP_pq16TQf_vv-FtN3tLKK-LycIyUYmhjgMvH4bR8D3v0vvx4ly9cwVAj69Ra_STgTd7uJwbc-UwOSqFmd19IW3KhxTaLoWe0h-HzfXeYB1RletWi57NHpdvuKvrVAd0Cp6B2NH3s24pCwZEBzvTtQYNdFfYga9DgG2OZDsVVkiTu7VFNGnBQUYYyJpOgvDZTyN2om_D0lQ1DIyL5jkhpfjybSu5o70PnJtAudITOY3aEG2SkT7D23xb-LLuBkl0lcpQBCZOJZI1dilQpYm2K8gHrSZykM8i-j1oCkVh_IUAVoPe3Ybz";

const spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(token);

//GET MY PROFILE DATA
function getMyData() {
  (async () => {
    const me = await spotifyApi.getMe();
    console.log(me.body);
    getUserPlaylists(me.body.id);
  })().catch(e => {
    console.error(e);
  });
}

//GET MY PLAYLISTS
async function getUserPlaylists(userName) {
  const data = await spotifyApi.getUserPlaylists(userName)

  console.log("---------------+++++++++++++++++++++++++")
  let playlists = []

  for (let playlist of data.body.items) {
    console.log(playlist.name + " " + playlist.id)
    
    let tracks = await getPlaylistTracks(playlist.id, playlist.name);
    console.log(tracks);

    const tracksJSON = { tracks }
    let data = JSON.stringify(tracksJSON);
    fs.writeFileSync(playlist.name+'.json', data);
  }
}

//GET SONGS FROM PLAYLIST
async function getPlaylistTracks(playlistId, playlistName) {

  const data = await spotifyApi.getPlaylistTracks(playlistId, {
    offset: 1,
    limit: 100,
    fields: 'items'
  })

  console.log('The playlist contains these tracks', data.body);
  console.log('The playlist contains these tracks: ', data.body.items[0].track);
  console.log("'" + playlistName + "'" + ' contains these tracks:');
  let tracks = [];

  for (let track_obj of data.body.items) {
    const track = track_obj.track
    tracks.push(track);
    let query = track.name + " " + track.artists[0].name;
    searchYouTube(query);
    console.log(track.name + " : " + track.artists[0].name)
  }
  
  console.log("---------------+++++++++++++++++++++++++")
  return tracks;
}


async function searchAndDownloadSongs() {
  try {
    // Call the function to get user playlists and tracks
    const me = await spotifyApi.getMe();
    await getUserPlaylists(me.body.id);

    // Read the JSON files and extract the track information
    const playlistFiles = fs.readdirSync('.');
    for (const file of playlistFiles) {
      if (file.endsWith('.json')) {
        const playlistData = JSON.parse(fs.readFileSync(file));
        const tracks = playlistData.tracks;

        // Search and download each track
        for (const track of tracks) {
          const query = track.name + ' ' + track.artists[0].name;
          const videoIds = await searchYouTube(query);

          if (videoIds.length > 0) {
            // Download the first video (you may consider handling multiple results)
            await downloadYouTubeVideo(videoIds[0], 'songs');
          } else {
            console.log('No video found for:', query);
          }
        }
      }
    }

    console.log('All songs downloaded successfully!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}


getMyData();

searchAndDownloadSongs();

//Not Taking playlist same name
//not taking podcast or other than song