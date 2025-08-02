const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// === Uploads klasörü ===
const uploadDir = path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Uploads klasörü oluşturuldu.');
  } else {
    console.log('Uploads klasörü zaten var.');
  }
} catch (err) {
  console.error('Uploads klasörü oluşturulamadı:', err);
}

// === Multer ayarı (mkdir yapmaz, sadece kaydeder) ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// === Middleware ===
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// === Ana route ===
app.get('/', (req, res) => {
  res.send('Sunucu çalışıyor');
});

// === Dosya yükleme route ===
app.post('/upload', upload.single('file'), (req, res) => {
  res.send('Dosya yüklendi: ' + req.file.filename);
});

// === Sunucu başlatma ===
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
