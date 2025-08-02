// File: src/lib/constants.ts (Updated, no major changes but ensure APP_NAME)
import { type AccountAssociation } from '@farcaster/miniapp-core/src/manifest';

// URL cơ bản (thay NEXT_PUBLIC_URL trong .env nếu cần)
export const APP_URL: string = process.env.NEXT_PUBLIC_URL!;

// Tên app
export const APP_NAME = 'MINIIS3';

// Mô tả app (đã chỉnh cho lottery)
export const APP_DESCRIPTION = 'Mini lottery app on Farcaster, pick lucky numbers and win USDC';

// Phân loại chính
export const APP_PRIMARY_CATEGORY = 'games';

// Tags (đã chỉnh liên quan lottery)
export const APP_TAGS = ['lottery', 'betting', 'lucky', 'draw', 'numbers', 'vietnam', 'crypto', 'farcaster', 'web3'];

// URL icon (thay nếu có icon custom)
export const APP_ICON_URL: string = `${APP_URL}/icon.png`;

// URL OG image (thay nếu cần)
export const APP_OG_IMAGE_URL: string = `${APP_URL}/api/opengraph-image`;

// URL splash (thay nếu cần)
export const APP_SPLASH_URL: string = `${APP_URL}/splash.png`;

// Màu nền splash (thay nếu cần)
export const APP_SPLASH_BACKGROUND_COLOR: string = '#f7f7f7';

// Liên kết tài khoản
export const APP_ACCOUNT_ASSOCIATION: AccountAssociation | undefined = undefined;

// Text nút chính (true cho MINIIS3 vì dùng wallet cho contract)
export const APP_BUTTON_TEXT = 'Try U Luck';

// URL webhook (tự động dùng Neynar nếu có API key)
export const APP_WEBHOOK_URL: string =
  process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;

// Bật/tắt wallet (true cho MINIIS3 vì dùng wallet cho contract)
export const USE_WALLET = true;

// Bật/tắt analytics
export const ANALYTICS_ENABLED = false;

// Chain yêu cầu (true cho MINIIS3 vì dùng wallet cho contract)
export const APP_REQUIRED_CHAINS: string[] = ['eip155:84532'];  // Base Sepolia testnet, thay nếu mainnet

// Không thay đổi (EIP-712 cho signed key)
export const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: 'Farcaster SignedKeyRequestValidator',
  version: '1',
  chainId: 10,
  verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553' as `0x${string}`,
};

// Không thay đổi (type cho signed key)
export const SIGNED_KEY_REQUEST_TYPE = [
  { name: 'requestFid', type: 'uint256' },
  { name: 'key', type: 'bytes' },
  { name: 'deadline', type: 'uint256' },
];