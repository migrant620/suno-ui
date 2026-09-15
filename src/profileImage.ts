import { Image, Platform } from 'react-native';
import { Image as DecodedImage } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';

export async function profileImageUri(asset: ImagePickerAsset): Promise<string> {
  const data = asset.base64;
  if (!data || data.length > 4_000_000) throw new Error('Image unavailable or too large');
  // The picker can return JPEG bytes while retaining the source PNG MIME type.
  const mime = data.startsWith('/9j/') ? 'image/jpeg'
    : data.startsWith('iVBORw0KGgo') ? 'image/png'
    : data.startsWith('R0lGOD') ? 'image/gif'
    : asset.mimeType || 'image/jpeg';
  const uri = `data:${mime};base64,${data}`;
  if (Platform.OS === 'android') {
    // RN 0.86's encoded getSize pipeline rejects data URIs. Decode the actual
    // embedded bytes with the existing native image module before accepting them.
    const image = await DecodedImage.loadAsync(uri);
    try {
      if (!(image.width > 0 && image.height > 0)) throw new Error('Image is empty');
    } finally { image.release(); }
  } else {
    await new Promise<void>((resolve, reject) => Image.getSize(uri, (width, height) => {
      if (width > 0 && height > 0) resolve(); else reject(new Error('Image is empty'));
    }, reject));
  }
  return uri;
}
