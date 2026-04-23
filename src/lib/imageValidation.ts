/**
 * Client-side image validation for KYC uploads.
 * Checks: format, size, min/max dimensions, and sharpness (blur detection)
 * via variance of Laplacian on a grayscale downscaled version.
 */

export interface ImageValidationOptions {
  maxSizeMB?: number;
  minSizeKB?: number;
  minWidth?: number;
  minHeight?: number;
  /** Minimum variance of Laplacian. Lower = blurrier. ~80 is a sane threshold for phone photos. */
  minSharpness?: number;
  acceptedTypes?: string[];
}

export interface ImageValidationResult {
  ok: boolean;
  error?: string;
  details?: { width: number; height: number; sharpness: number; sizeKB: number };
}

const DEFAULTS: Required<ImageValidationOptions> = {
  maxSizeMB: 10,
  minSizeKB: 20,
  minWidth: 480,
  minHeight: 480,
  minSharpness: 70,
  acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem.'));
    };
    img.src = url;
  });
}

/**
 * Estimate sharpness via variance of Laplacian on a downscaled grayscale image.
 * Higher value = sharper. Typical: blurry < 50, OK > 100.
 */
function computeSharpness(img: HTMLImageElement): number {
  const target = 320;
  const scale = Math.min(1, target / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // grayscale buffer
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 3x3 Laplacian kernel: [0,1,0,1,-4,1,0,1,0]
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v =
        -4 * gray[i] +
        gray[i - 1] +
        gray[i + 1] +
        gray[i - w] +
        gray[i + w];
      sum += v;
      sumSq += v * v;
      count++;
    }
  }
  if (!count) return 0;
  const mean = sum / count;
  return sumSq / count - mean * mean; // variance
}

export async function validateImageFile(
  file: File,
  opts: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const o = { ...DEFAULTS, ...opts };
  const sizeKB = file.size / 1024;

  if (!o.acceptedTypes.includes(file.type.toLowerCase())) {
    return {
      ok: false,
      error: 'Formato inválido. Use JPG, PNG ou WEBP.',
    };
  }
  if (sizeKB > o.maxSizeMB * 1024) {
    return { ok: false, error: `Ficheiro muito grande. Máximo: ${o.maxSizeMB}MB.` };
  }
  if (sizeKB < o.minSizeKB) {
    return { ok: false, error: `Imagem muito pequena ou comprimida (mín. ${o.minSizeKB}KB).` };
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { ok: false, error: 'Não foi possível abrir a imagem. Tente outra foto.' };
  }

  if (img.width < o.minWidth || img.height < o.minHeight) {
    return {
      ok: false,
      error: `Resolução baixa (${img.width}×${img.height}). Mínimo ${o.minWidth}×${o.minHeight}.`,
    };
  }

  const sharpness = computeSharpness(img);
  if (sharpness < o.minSharpness) {
    return {
      ok: false,
      error: 'Imagem desfocada. Tire a foto com mais luz, foco e sem tremer.',
      details: { width: img.width, height: img.height, sharpness, sizeKB },
    };
  }

  return {
    ok: true,
    details: { width: img.width, height: img.height, sharpness, sizeKB },
  };
}