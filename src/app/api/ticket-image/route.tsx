// Modified: src/app/api/ticket-image/route.tsx
// Changes:
// - Removed BET AMOUNT and BET TYPE spans completely
// - Adjusted positions based on new ticket layout (estimated from image):
//   - TRANSACTION: top 30px, left 100px
//   - PLAYER/NUMBER: top 60px, left 100px (player / number)
//   - ROUND OF PLAY: top 120px, left 100px (round)
//   - DATE/TIME: top 150px, left 100px (currentTime)
//   - Number in circle: top 60px, left 30px, font 40px
// - Removed contract span (not mentioned in new layout)
// - Updated player/number to `${player}/${number}` in one span
// - Kept randomOffset and randomRotate for slight variation
// - Dimensions kept at 300x200; adjust if image size differs

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number') || '00';
  const round = searchParams.get('round') || '1';
  const player = searchParams.get('player') || '';
  const txHash = searchParams.get('txHash') || '';

  const appUrl = process.env.NEXT_PUBLIC_URL || 'https://your-app-url.vercel.app';
  const fontUrl = `${appUrl}/fonts/Roboto-Regular.ttf`;
  const imageUrl = `${appUrl}/ticket-background.png`;

  const truncatedHash = txHash ? `${txHash.slice(0, 6)}...${txHash.slice(-7)}` : '';
  const currentTime = new Date().toLocaleString();
  const playerNumber = `${player}/${number}`;

  const randomOffset = (base: number, range: number = 2) => base + Math.floor(Math.random() * (range * 2 + 1)) - range;
  const randomRotate = (range: number = 0.5) => (Math.random() * (range * 2)) - range;

  let fontData;
  try {
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) throw new Error('Failed to load font');
    fontData = await fontResponse.arrayBuffer();
  } catch (error) {
    console.error('Error loading font:', error);
    return new ImageResponse(
      <div
        style={{
          width: '300px',
          height: '200px',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          position: 'relative',
          color: '#000000',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        <span style={{ position: 'absolute', top: `${randomOffset(30)}px`, left: `${randomOffset(100)}px`, fontSize: '15px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{truncatedHash}</span>
        <span style={{ position: 'absolute', top: `${randomOffset(60)}px`, left: `${randomOffset(100)}px`, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{playerNumber}</span>
        <span style={{ position: 'absolute', top: `${randomOffset(120)}px`, left: `${randomOffset(100)}px`, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{round}</span>
        <span style={{ position: 'absolute', top: `${randomOffset(150)}px`, left: `${randomOffset(100)}px`, fontSize: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{currentTime}</span>
        <span style={{ position: 'absolute', top: `${randomOffset(60)}px`, left: `${randomOffset(30)}px`, fontSize: '40px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{number}</span>
      </div>,
      { width: 300, height: 200 }
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: '300px',
        height: '200px',
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        position: 'relative',
        color: '#000000',
        fontFamily: 'Roboto',
        fontSize: '16px',
        fontWeight: 'bold',
      }}
    >
      <span style={{ position: 'absolute', top: `${randomOffset(30)}px`, left: `${randomOffset(100)}px`, fontSize: '15px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{truncatedHash}</span>
      <span style={{ position: 'absolute', top: `${randomOffset(60)}px`, left: `${randomOffset(100)}px`, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{playerNumber}</span>
      <span style={{ position: 'absolute', top: `${randomOffset(120)}px`, left: `${randomOffset(100)}px`, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{round}</span>
      <span style={{ position: 'absolute', top: `${randomOffset(150)}px`, left: `${randomOffset(100)}px`, fontSize: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{currentTime}</span>
      <span style={{ position: 'absolute', top: `${randomOffset(60)}px`, left: `${randomOffset(30)}px`, fontSize: '40px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{number}</span>
    </div>,
    {
      width: 300,
      height: 200,
      fonts: [{ name: 'Roboto', data: fontData, weight: 400, style: 'normal' }],
    }
  );
}