function isHeicLike(file) {
  const fileName = file.name.toLowerCase();
  return file.type === 'image/heic'
    || file.type === 'image/heif'
    || fileName.endsWith('.heic')
    || fileName.endsWith('.heif');
}

function renameAsJpeg(fileName) {
  return fileName.replace(/\.(heic|heif)$/i, '.jpg');
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

async function convertImageFileToJpeg(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('El navegador no permitió procesar la imagen.');
    }

    context.drawImage(image, 0, 0);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((generatedBlob) => {
        if (!generatedBlob) {
          reject(new Error('No se pudo convertir la imagen a JPEG.'));
          return;
        }
        resolve(generatedBlob);
      }, 'image/jpeg', 0.92);
    });

    return {
      url: await readBlobAsDataUrl(blob),
      name: renameAsJpeg(file.name),
      type: 'image/jpeg',
      originalType: file.type || 'application/octet-stream',
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function normalizeImageUpload(file) {
  if (isHeicLike(file)) {
    try {
      return await convertImageFileToJpeg(file);
    } catch {
      throw new Error('No se pudo convertir la imagen HEIC. Intenta exportarla como JPG o PNG y vuelve a subirla.');
    }
  }

  return {
    url: await readBlobAsDataUrl(file),
    name: file.name,
    type: file.type,
    originalType: file.type,
  };
}
