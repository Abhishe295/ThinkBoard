import multer  from "multer";
import fs from 'fs';
import path from 'path';

const tempDir = path.join(process.cwd(), 'temp_voice');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("Created temp_voice directory at:", tempDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `voice_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/wav', 'audio/webm', 'audio/mp3', 'audio/mpeg'];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported audio format'), false);
};

const uploadVoice = multer({ storage, fileFilter });
export default uploadVoice;