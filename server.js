const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Public klasörünü statik olarak aç
app.use(express.static(path.join(__dirname, 'public')));

// Uploads klasörünü statik olarak aç (fotoğraflar görünsün)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// uploads klasörü yoksa oluştur
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer ayarları (dosya nereye kaydedilecek)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Ana sayfa testi
app.get('/', (req, res) => {
  res.send('Sunucu Çalışıyor');
});

// Fotoğraf yükleme endpointi
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Dosya yüklenmedi' });
  }
  res.json({ message: 'Fotoğraf yüklendi', file: req.file.filename });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




