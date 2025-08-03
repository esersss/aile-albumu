const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Uploads klasörünü oluştur
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer ayarı
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// HTML sayfaları
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Upload POST endpoint
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Dosya yüklenmedi.');
  }
  res.send(`Fotoğraf başarıyla yüklendi: ${req.file.filename}`);
});

// Sunucu başlat
app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});



