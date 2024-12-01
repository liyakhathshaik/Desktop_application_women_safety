const { app, BrowserWindow, Notification, Tray, Menu } = require('electron');
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const fs = require('fs');
const admin = require('firebase-admin');
const audio = require('node-web-audio-api');
const audioContext = new audio.AudioContext();

// Firebase Admin SDK setup
const serviceAccount = require('./guardian-gesture-firebase-adminsdk-vc1w6-266d1d9c74.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'guardian-gesture.appspot.com',
  databaseURL: 'https://guardian-gesture-default-rtdb.firebaseio.com'
});

const bucket = admin.storage().bucket();
const db = admin.database();
const localFolder = path.join(__dirname, 'downloaded_images');

if (!fs.existsSync(localFolder)) {
  fs.mkdirSync(localFolder);
}

const expressApp = express();
const server = http.createServer(expressApp);
const io = socketIO(server);

expressApp.set('view engine', 'ejs');
expressApp.set('views', path.join(__dirname, 'views'));

let mainWindow;
let tray;
let isQuiting = false;

function showNotification(title) {
  new Notification({ title}).show();
}

function playEmergencySound() {
  const soundFile = path.join(__dirname, 'sounds', 'emergency-sound.mp3');

  fs.readFile(soundFile, (err, data) => {
    if (err) {
      console.error('Error reading sound file:', err);
      return;
    }

    const arrayBuffer = Uint8Array.from(data).buffer;

    audioContext.decodeAudioData(arrayBuffer, (buffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    }, (error) => {
      console.error('Error decoding audio data:', error);
    });
  });
}

function downloadImagesFromFirebase() {
  bucket.getFiles({ prefix: 'images/' }, (err, files) => {
    if (err) {
      console.error('Error getting files from Firebase Storage:', err);
      return;
    }

    files.forEach(file => {
      if (file.name.endsWith('.jpg')) {
        const localPath = path.join(localFolder, path.basename(file.name));
        if (!fs.existsSync(localPath)) {
          file.download({ destination: localPath }, (err) => {
            if (err) {
              console.error('Error downloading file:', err);
              return;
            }
            console.log(`Downloaded ${localPath}`);
            io.emit('new_image', { filename: path.basename(file.name) });

            // Show the notification
            showNotification("Emergency Detected ...");

            // Play the emergency sound
            playEmergencySound();
          });
        }
      }
    });
  });
}

setInterval(downloadImagesFromFirebase, 5000);

expressApp.get('/', (req, res) => {
  fs.readdir(localFolder, (err, files) => {
    if (err) {
      console.error('Error reading local folder:', err);
      res.sendStatus(500);
      return;
    }

    const imageFiles = files.filter(file => file.endsWith('.jpg'));

    const locationRef = db.ref('location');
    locationRef.once('value', (snapshot) => {
      const locationData = snapshot.val();
      res.render('index', { imageFiles, locationData });
    });
  });
});

expressApp.get('/image/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(localFolder, fileName);
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('minimize', function (event) {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('close', function (event) {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

app.whenReady().then(() => {
  createWindow();

  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Guardian Gesture');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.show();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let storefilename = new Set();
io.on('connection', (socket) => {
  console.log('A client connected');

  fs.readdir(localFolder, (err, files) => {
    if (err) {
      console.error('Error reading the local folder:', err);
      return;
    }

    const imageFiles = files ? files.filter(file => file.endsWith('.jpg')).slice(-10) : [];

    const extractTime = filename => {
      const timeString = filename ? filename.slice(-10, -4) : [];
      const hour = timeString ? parseInt(timeString.slice(0, 2)) : [];
      const minute = timeString ? parseInt(timeString.slice(2, 4)) : [];
      return { hour, minute };
    };

    const lastFileTime = extractTime(imageFiles[imageFiles.length - 1]);

    const filteredFiles = imageFiles.filter(file => {
      const { hour, minute } = extractTime(file);
      const timeDifference = (lastFileTime.hour * 60 + lastFileTime.minute) - (hour * 60 + minute);
      return timeDifference >= 0 && timeDifference <= 2;
    });

    filteredFiles.forEach(file => {
      if (!storefilename.has(file)) {
        socket.emit('new_image', { filename: file });
        storefilename.add(file);
      }
    });

  });

  const fetchLocation = async () => {
    let data = null;

    try {
      const res = await fetch(`https://guardian-gesture-default-rtdb.firebaseio.com/location.json`);

      if (res.ok) {
        data = await res.json();

        if (data && data['latitude'] && data['longitude']) {
          socket.emit('location_data', { latitude: data['latitude'], longitude: data['longitude'] });
        } else {
          console.error('Latitude or Longitude data is missing.');
        }

      } else {
        throw new Error('Failed to fetch data.');
      }

    } catch (error) {
      console.error('Error:', error);
    }
  }
  fetchLocation();
  setInterval(() => {
    fetchLocation();
  }, 5000);
});
