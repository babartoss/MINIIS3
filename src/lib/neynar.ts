import { NeynarAPIClient, Configuration, WebhookUserCreated } from '@neynar/nodejs-sdk';
import { APP_URL } from './constants';

let neynarClient: NeynarAPIClient | null = null;

// Lấy client Neynar (thay API key trong .env nếu cần)
export function getNeynarClient() {
  if (!neynarClient) {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY not configured');
    }
    const config = new Configuration({ apiKey });
    neynarClient = new NeynarAPIClient(config);
  }
  return neynarClient;
}

type User = WebhookUserCreated['data'];

export async function getNeynarUser(fid: number): Promise<User | null> {
  try {
    const client = getNeynarClient();
    const usersResponse = await client.fetchBulkUsers({ fids: [fid] });
    return usersResponse.users[0];
  } catch (error) {
    console.error('Error getting Neynar user:', error);
    return null;
  }
}

type SendMiniAppNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

// Updated: Support broadcast with fids: [] for all users who added the mini-app
export async function sendNeynarMiniAppNotification({
  fids = [],  // Empty array for broadcast to all eligible users
  title,
  body,
}: {
  fids?: number[];  // Optional, empty for broadcast
  title: string;
  body: string;
}): Promise<SendMiniAppNotificationResult> {
  try {
    const client = getNeynarClient();
    const targetFids = fids;
    const notification = {
      title,
      body,
      target_url: APP_URL,
    };

    const result = await client.publishFrameNotifications({ 
      targetFids, 
      notification 
    });

    if (result.notification_deliveries.length > 0) {
      return { state: "success" };
    } else if (result.notification_deliveries.length === 0) {
      return { state: "no_token" };
    } else {
      return { state: "error", error: result || "Unknown error" };
    }
  } catch (error) {
    return { state: "error", error };
  }
}