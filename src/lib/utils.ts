import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
// Import Manifest nếu cần, nhưng dùng any để linh hoạt và fix type error
// import { Manifest } from '@farcaster/miniapp-core/src/manifest';
import {
  APP_BUTTON_TEXT,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_PRIMARY_CATEGORY,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_SPLASH_URL,
  APP_TAGS,
  APP_URL,
  APP_WEBHOOK_URL,
  APP_ACCOUNT_ASSOCIATION,
} from './constants';

// Hàm kết hợp class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Metadata cho embed miniapp (thay ogImageUrl nếu cần custom) - Giữ để embed frame trong Warpcast
export function getMiniAppEmbedMetadata(ogImageUrl?: string) {
  return {
    version: 'next',
    imageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    ogTitle: APP_NAME,
    ogDescription: APP_DESCRIPTION,
    ogImageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT,
      action: {
        type: 'launch_frame',
        name: APP_NAME,
        url: APP_URL,
        splashImageUrl: APP_SPLASH_URL,
        iconUrl: APP_ICON_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
        description: APP_DESCRIPTION,
        primaryCategory: APP_PRIMARY_CATEGORY,
        tags: APP_TAGS,
      },
    },
  };
}

// Manifest cho Farcaster domain (match spec 2025: required version/name/homeUrl/imageUrl/buttonTitle; optional icon/splash/webhook)
export async function getFarcasterDomainManifest(): Promise<any> {  // Dùng any để fix type error với 'triggers'
  return {
    accountAssociation: APP_ACCOUNT_ASSOCIATION!,
    frame: {
      version: '1',  // Required
      name: APP_NAME,  // Required, use 'MINIIS3'
      homeUrl: APP_URL,  // Required
      imageUrl: APP_OG_IMAGE_URL,  // Required, 3:2 ratio
      buttonTitle: APP_BUTTON_TEXT,  // Required, 'Try Your Luck'
      iconUrl: APP_ICON_URL,  // Optional, 200x200 PNG
      splashImageUrl: APP_SPLASH_URL,  // Optional
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,  // Optional
      webhookUrl: APP_WEBHOOK_URL,  // Optional for notifications
    },
    triggers: [],  // Optional, giữ empty nếu không có
  };
}