require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase ayarları
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Local uploads klasörü (geçici)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const users = JSON.parse(fs.readFileSync('users.json'));
let memoryList = fs.existsSync('data.json')
  ? JSON.parse(fs.readFileSync('data.json'))
  : [];

const upload = multer({ dest: 'uploads/' });

function auth(req, res, next) {
  if (req.cookies.kullanici) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// LOGIN
app.post('/login', (req, res) => {
  const { ad, soyad, sifre } = req.body;
  const user = users.find(
    (u) => u.ad === ad && u.soyad === soyad && u.sifre === sifre
  );
  if (user) {
    res.cookie('kullanici', `${ad} ${soyad}`, { maxAge: 3600000 });
    res.redirect('/');
  } else {
    res.send('Hatalı giriş! <a href="/login.html">Tekrar dene</a>');
  }
});

// SAYFALAR
app.get('/', auth, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/upload.html', auth, (req, res) => {
  res.sendFile(__dirname + '/public/upload.html');
});

app.get('/data', auth, (req, res) => {
  res.json(memoryList);
});

// UPLOAD (Supabase)
app.post('/upload', auth, upload.single('media'), async (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname);
  const newFileName = `${Date.now()}_${file.originalname}`;

  try {
    // Supabase bucket'a yükle
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(newFileName, fs.createReadStream(file.path), {
        contentType: file.mimetype,
        duplex: 'half'
      });

    if (error) {
      console.error('Supabase yükleme hatası:', error);
      return res.status(500).send('Yükleme başarısız');
    }

    // Public URL oluştur
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(newFileName);

    const item = {
      url: publicUrlData.publicUrl,
      type: file.mimetype,
      ekleyen: req.cookies.kullanici,
      date: new Date()
    };

    memoryList.push(item);
    fs.writeFileSync('data.json', JSON.stringify(memoryList, null, 2));

    // Temp dosyayı sil
    fs.unlinkSync(file.path);

    res.redirect('/');
  } catch (err) {
    console.error('Hata:', err);
    res.status(500).send('Bir hata oluştu.');
  }
});

// LOGOUT
app.get('/logout', (req, res) => {
  res.clearCookie('kullanici');
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`Site çalışıyor: http://localhost:${PORT}`);
});

