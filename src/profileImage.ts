import { Image, Platform } from 'react-native';
import { Image as DecodedImage } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
export async function profileImageUri(asset: ImagePickerAsset): Promise<string> {
    const data = asset.base64;
    if (!data || data.length > 4000000)
        throw new Error('Image unavailable or too large');
    const mime = data.startsWith('/9j/') ? 'image/jpeg'
        : data.startsWith('iVBORw0KGgo') ? 'image/png'
            : data.startsWith('R0lGOD') ? 'image/gif'
                : asset.mimeType || 'image/jpeg';
    const uri = `data:${mime};base64,${data}`;
    if (Platform.OS === 'android') {
        const image = await DecodedImage.loadAsync(uri);
        try {
            if (!(image.width > 0 && image.height > 0))
                throw new Error('Image is empty');
        }
        finally {
            image.release();
        }
    }
    else {
        await new Promise<void>((resolve, reject) => Image.getSize(uri, (width, height) => {
            if (width > 0 && height > 0)
                resolve();
            else
                reject(new Error('Image is empty'));
        }, reject));
    }
    return uri;
}
