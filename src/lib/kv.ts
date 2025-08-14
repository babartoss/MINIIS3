// src/lib/kv.ts
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

// New: Add participant to round list (use hash or JSON array for simplicity)
export async function addParticipantToRound(round: number, data: { number: string; address: string; fid?: number; username?: string }) {
  const key = `${PREFIX}participants_round_${round}`;
  const currentList = await redis.get(key);
  const list = currentList ? JSON.parse(currentList as string) : [];
  // Avoid duplicate by number
  if (!list.some((p: any) => p.number === data.number)) {
    list.push(data);
    await redis.set(key, JSON.stringify(list));
    await redis.expire(key, 86400); // TTL 1 day for round data
  }
}

// New: Get participants for round from Redis
export async function getParticipantsForRound(round: number): Promise<{ number: string; user: string; round: string }[]> {
  const key = `${PREFIX}participants_round_${round}`;
  const data = await redis.get(key);
  return data ? JSON.parse(data as string).map((p: any) => ({ number: p.number, user: p.username || truncateAddress(p.address), round: round.toString() })) : [];
}

// Helper truncate
function truncateAddress(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}