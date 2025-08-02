const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- uploads klasörü kontrolü (önemli) ---
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer ayarı
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Ana route
app.get("/", (req, res) => {
  res.send("Sunucu Çalışıyor");
});

// Fotoğraf yükleme test formu (GET)
app.get("/upload", (req, res) => {
  res.send(`
    <h2>Fotoğraf Yükle</h2>
    <form method="POST" action="/upload" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Yükle</button>
    </form>
  `);
});

// Fotoğraf yükleme (POST)
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Dosya yüklenmedi.");
  }
  res.send("Dosya yüklendi: " + req.file.filename);
});

// Buradan itibaren senin diğer route’ların varsa onlar aynı şekilde devam edecek

app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});

