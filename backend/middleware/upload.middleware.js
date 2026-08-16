// backend/middleware/upload.middleware.js
// Multer configuration for profile image uploads (avatar / cover).
// Validates MIME type, enforces a size cap, and generates collision-safe filenames.
// Used in: backend/routes/upload.routes.js.

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const COVER_DIR = path.join(UPLOAD_DIR, 'covers');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// Ensure the target directories exist before multer writes into them.
for (const dir of [UPLOAD_DIR, AVATAR_DIR, COVER_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const isCover = req.route?.path?.includes('cover');
    cb(null, isCover ? COVER_DIR : AVATAR_DIR);
  },
  filename(req, file, cb) {
    const ext = EXTENSIONS[file.mimetype] || path.extname(file.originalname || '').toLowerCase() || '.bin';
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
});

// Upload a single image file. Callers pass the request field name ('avatar' or 'cover').
const uploadSingleImage = (fieldName) => upload.single(fieldName);

module.exports = {
  upload,
  uploadSingleImage,
  UPLOAD_DIR,
  AVATAR_DIR,
  COVER_DIR,
  MAX_IMAGE_SIZE,
  ALLOWED_MIME,
};
