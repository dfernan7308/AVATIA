const MAX_DIMENSION = 2048;
const TARGET_MAX_BYTES = 4 * 1024 * 1024;
const JPEG_QUALITIES = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];

function isHeicLike(file) {
  const fileName = file.name.toLowerCase();
  return file.type === 'image/heic'
    || file.type === 'image/heif'
    || fileName.endsWith('.heic')
    || fileName.endsWith('.heif');
}

function shouldReencode(file) {
  return isHeicLike(file)
    || file.size > TARGET_MAX_BYTES
    || !file.type
    || !file.type.startsWith('image/');
}

function renameWithJpegExtension(fileName) {
  if (/\.(heic|heif|png|webp|jpeg|jpg)$/i.test(fileName)) {
    return fileName.replace(/\.(heic|heif|png|webp|jpeg|jpg)$/i, '.jpg');
  }
  return `${fileName}.jpg`;
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    reader.readAsDataURL(blob);
  });
}

function loadImageFromObjectUrl(objectUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo decodificar la imagen.'));
    image.src = objectUrl;
  });
}

function calculateOutputSize(width, height) {
  const largestSide = Math.max(width, height);
  if (largestSide <= MAX_DIMENSION) {
    return { width, height };
  }

  const ratio = MAX_DIMENSION / largestSide;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((generatedBlob) => {
      if (!generatedBlob) {
        reject(new Error('No se pudo convertir la imagen.'));
        return;
      }
      resolve(generatedBlob);
    }, 'image/jpeg', quality);
  });
}

async function rasterizeAndCompress(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const { width, height } = calculateOutputSize(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('El navegador no permitió procesar la imagen.');
    }

    context.drawImage(image, 0, 0, width, height);

    let bestBlob = null;
    for (const quality of JPEG_QUALITIES) {
      const candidate = await canvasToBlob(canvas, quality);
      bestBlob = candidate;
      if (candidate.size <= TARGET_MAX_BYTES) {
        break;
      }
    }

    if (!bestBlob) {
      throw new Error('No se pudo comprimir la imagen.');
    }

    return {
      url: await readBlobAsDataUrl(bestBlob),
      name: renameWithJpegExtension(file.name),
      type: 'image/jpeg',
      originalType: file.type || 'application/octet-stream',
      originalSize: file.size,
      optimizedSize: bestBlob.size,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function normalizeImageUpload(file) {
  if (shouldReencode(file)) {
    try {
      return await rasterizeAndCompress(file);
    } catch {
      if (isHeicLike(file)) {
        throw new Error('No se pudo convertir la imagen HEIC. Intenta exportarla como JPG o PNG y vuelve a subirla.');
      }
      throw new Error('No se pudo optimizar la imagen. Intenta con un JPG o PNG más liviano.');
    }
  }

  return {
    url: await readBlobAsDataUrl(file),
    name: file.name,
    type: file.type,
    originalType: file.type,
    originalSize: file.size,
    optimizedSize: file.size,
  };
}
