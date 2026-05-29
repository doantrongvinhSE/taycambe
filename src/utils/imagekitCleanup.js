const ImageKit = require('@imagekit/nodejs').default;

let imagekit;

const getImageKit = () => {
  if (!imagekit) {
    imagekit = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL
    });
  }
  return imagekit;
};

const getImageUrl = (image) => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.url || '';
};

const getImagePublicId = (image) => {
  if (!image || typeof image === 'string') return '';
  return image.public_id || image.publicId || '';
};

const normalizeImage = (image) => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return {
    url: image.url || '',
    public_id: image.public_id || image.publicId || ''
  };
};

const normalizeImages = (images) => (Array.isArray(images) ? images.map(normalizeImage).filter(Boolean) : []);

const collectImages = (...groups) => groups.flatMap((group) => {
  if (!group) return [];
  return Array.isArray(group) ? group : [group];
});

const findRemovedImages = (oldImages, newImages) => {
  const newUrls = new Set(newImages.map(getImageUrl).filter(Boolean));
  return oldImages.filter((image) => {
    const url = getImageUrl(image);
    return url && !newUrls.has(url) && getImagePublicId(image);
  });
};

const deleteImageKitFiles = async (images) => {
  const publicIds = [...new Set(images.map(getImagePublicId).filter(Boolean))];
  await Promise.all(publicIds.map(async (publicId) => {
    try {
      await getImageKit().files.delete(publicId);
    } catch (error) {
      console.error('Lỗi xoá ảnh ImageKit:', publicId, error.message);
    }
  }));
};

module.exports = {
  collectImages,
  deleteImageKitFiles,
  findRemovedImages,
  getImagePublicId,
  getImageUrl,
  normalizeImage,
  normalizeImages
};
