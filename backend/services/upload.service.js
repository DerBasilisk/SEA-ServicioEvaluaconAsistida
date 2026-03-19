const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube un buffer a Cloudinary y devuelve la URL segura.
 */
function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Sube avatar de usuario — recorte circular 400x400
 */
async function uploadAvatar(buffer, userId) {
  return uploadBuffer(buffer, {
    folder:          `sea/avatars`,
    public_id:       `avatar_${userId}`,
    overwrite:       true,
    transformation:  [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    resource_type:   "image",
  });
}

/**
 * Sube banner de usuario — 1200x300
 */
async function uploadBanner(buffer, userId) {
  return uploadBuffer(buffer, {
    folder:          `sea/banners`,
    public_id:       `banner_${userId}`,
    overwrite:       true,
    transformation:  [{ width: 1200, height: 300, crop: "fill" }],
    resource_type:   "image",
  });
}

/**
 * Eliminar imagen de Cloudinary
 */
async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadAvatar, uploadBanner, deleteImage };
