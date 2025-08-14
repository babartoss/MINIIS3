import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const PREFIX = 'miniis3:'; // Prefix để tránh conflict keys với project khác (IBSnoCT)

export async function setUserNotificationDetails(fid: number, details: any) {
  await redis.set(`${PREFIX}notification:${fid}`, JSON.stringify(details));
}

export async function getUserNotificationDetails(fid: number) {
  const data = await redis.get(`${PREFIX}notification:${fid}`);
  return data ? JSON.parse(data as string) : null;
}

// Store address -> FID mapping
export async function setAddressFid(address: string, fid: number) {
  await redis.set(`${PREFIX}address_fid:${address.toLowerCase()}`, fid);
}

// Get FID by address
export async function getFidByAddress(address: string): Promise<number | null> {
  const fid = await redis.get(`${PREFIX}address_fid:${address.toLowerCase()}`);
  return fid ? Number(fid) : null;
}

// New: Add FID to users set for broadcast
export async function addUserFid(fid: number) {
  await redis.sadd(`${PREFIX}users`, fid);
}

// New: Get all user FIDs for broadcast
export async function getAllUserFids(): Promise<number[]> {
  const members = await redis.smembers(`${PREFIX}users`);
  return members.map(Number);
}
// New: Cache user info
export async function setUserInfo(fid: number, info: { username: string; display_name: string }) {
  await redis.set(`${PREFIX}user_info:${fid}`, JSON.stringify(info), { ex: 86400 }); // TTL 24h
}

export async function getUserInfo(fid: number) {
  const data = await redis.get(`${PREFIX}user_info:${fid}`);
  return data ? JSON.parse(data as string) : null;
}