# ImageKit Upload Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển API upload ảnh từ Cloudinary sang ImageKit nhưng giữ nguyên contract hiện tại cho frontend.

**Architecture:** Route upload tiếp tục nằm ở `src/routes/upload.js` và vẫn expose `POST /api/v1/upload/image` và `POST /api/v1/upload/images`. `multer` chuyển sang `memoryStorage()` để nhận file vào RAM, sau đó upload buffer lên ImageKit SDK bằng key trong `.env`; response vẫn trả `{ url, public_id }`, trong đó `public_id` là `fileId` của ImageKit.

**Tech Stack:** Node.js, Express 5, CommonJS, multer 2, `@imagekit/nodejs`, dotenv, ImageKit Upload API.

---

## File Structure

- Modify: `src/routes/upload.js` — bỏ Cloudinary, cấu hình ImageKit, dùng multer memory storage, upload single/multiple ảnh và map response tương thích.
- Modify: `package.json` — gỡ dependency `cloudinary` và `multer-storage-cloudinary`, giữ `@imagekit/nodejs` và `multer`.
- Modify: `package-lock.json` — cập nhật lockfile sau khi gỡ dependency.

---

### Task 1: Replace Cloudinary upload implementation with ImageKit

**Files:**
- Modify: `src/routes/upload.js`

- [ ] **Step 1: Replace imports and SDK setup**

Replace the top of `src/routes/upload.js` lines 1-22 with:

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImageKit = require('@imagekit/nodejs').default;

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL
});

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
        cb(null, true);
    }
});
```

- [ ] **Step 2: Add ImageKit upload helper**

Insert this helper after the `upload` declaration in `src/routes/upload.js`:

```javascript
const uploadToImageKit = async (file) => {
    const result = await imagekit.files.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: '/taycam'
    });

    return {
        url: result.url,
        public_id: result.fileId
    };
};
```

- [ ] **Step 3: Update single image route**

Replace the existing `/image` route with:

```javascript
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided. Please use field name "image" in form-data'
            });
        }

        const uploadedFile = await uploadToImageKit(req.file);

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: uploadedFile
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
});
```

- [ ] **Step 4: Update multiple images route**

Replace the existing `/images` route with:

```javascript
router.post('/images', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided. Please use field name "images" in form-data'
            });
        }

        const uploadedFiles = await Promise.all(req.files.map(uploadToImageKit));

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading images',
            error: error.message
        });
    }
});
```

- [ ] **Step 5: Run syntax check**

Run:

```bash
node --check src/routes/upload.js
```

Expected: no output and exit code 0.

- [ ] **Step 6: Commit route migration**

Run:

```bash
git add src/routes/upload.js
git commit -m "migrate uploads to imagekit"
```

---

### Task 2: Remove Cloudinary dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Uninstall unused dependencies**

Run:

```bash
npm uninstall cloudinary multer-storage-cloudinary
```

Expected: `package.json` no longer contains `cloudinary` or `multer-storage-cloudinary`; `package-lock.json` no longer contains their package entries.

- [ ] **Step 2: Confirm ImageKit dependency remains**

Run:

```bash
npm ls @imagekit/nodejs multer
```

Expected: output includes `@imagekit/nodejs@7.6.2` and `multer@2.0.0` or compatible installed versions.

- [ ] **Step 3: Commit dependency cleanup**

Run:

```bash
git add package.json package-lock.json
git commit -m "remove cloudinary upload dependencies"
```

---

### Task 3: Verify upload APIs against ImageKit

**Files:**
- No code files changed in this task.

- [ ] **Step 1: Start the app locally**

Run:

```bash
npm start
```

Expected: app starts without module import errors and connects using existing `.env` config.

- [ ] **Step 2: Test missing single image request**

Run in a separate shell while server is running:

```bash
curl -X POST http://localhost:3001/api/v1/upload/image
```

Expected response includes:

```json
{
  "success": false,
  "message": "No image file provided. Please use field name \"image\" in form-data"
}
```

- [ ] **Step 3: Test single image upload**

Use any small local image file path and run:

```bash
curl -X POST http://localhost:3001/api/v1/upload/image -F "image=@path/to/local-image.png"
```

Expected response shape:

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://ik.imagekit.io/nlmksmytw/...",
    "public_id": "..."
  }
}
```

- [ ] **Step 4: Test multiple image upload**

Use two small local image file paths and run:

```bash
curl -X POST http://localhost:3001/api/v1/upload/images -F "images=@path/to/local-image-1.png" -F "images=@path/to/local-image-2.png"
```

Expected response shape:

```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": [
    {
      "url": "https://ik.imagekit.io/nlmksmytw/...",
      "public_id": "..."
    },
    {
      "url": "https://ik.imagekit.io/nlmksmytw/...",
      "public_id": "..."
    }
  ]
}
```

- [ ] **Step 5: Verify no Cloudinary references remain outside lock history**

Run:

```bash
npx --yes npm-check-updates --version
```

Do not use this output for verification; this command is intentionally not required. Instead run the codebase search using the environment's search tool for `cloudinary|Cloudinary|CLOUDINARY` excluding `node_modules` and `.git`.

Expected: no matches in source files or `package.json` / `package-lock.json`.

- [ ] **Step 6: Commit verification notes only if code changed**

If verification required any code changes, commit the changed files with:

```bash
git add src/routes/upload.js package.json package-lock.json
git commit -m "fix imagekit upload verification issues"
```

If no files changed, do not create a commit.

---

## Self-Review

- Spec coverage: Task 1 changes upload implementation to ImageKit and keeps existing response contract. Task 2 removes Cloudinary dependencies. Task 3 verifies single and multiple upload APIs plus missing-file errors.
- Placeholder scan: No TBD/TODO placeholders remain. The test commands that require local images explicitly state to use any small local image path.
- Type consistency: `uploadToImageKit()` returns `{ url, public_id }`; both route handlers use this same shape. `public_id` consistently maps to ImageKit `fileId`.
