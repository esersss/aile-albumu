const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Yüklenen dosyaların tutulacağı klasör
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Multer ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(cookieParser());
app.use(express.static("public"));
app.use("/uploads", express.static(uploadFolder));

// Anasayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Fotoğraf yükleme
app.post("/upload", upload.single("photo"), (req, res) => {
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
