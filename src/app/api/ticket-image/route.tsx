// src/app/api/ticket-image/route.tsx
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
        <span style={{ position: 'absolute', top: `${randomOffset(57)}px`, left: `${randomOffset(131)}px`, fontSize: '15px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{truncatedHash}</span>
        <span style={{ position: 'absolute', top: `${randomOffset(82)}px`, left: `${randomOffset(150)}px`, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{playerNumber}</span>
        <span style={{ position: 'absolute', top: `${randomOffset(124)}px`, left: `${randomOffset(172)}px`, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{round}</span>
        <span style={{ position: 'absolute', top: `${randomOffset(144)}px`, left: `${randomOffset(130)}px`, fontSize: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{currentTime}</span>
        <span style={{ position: 'absolute', top: `${randomOffset(101)}px`, left: `${randomOffset(62)}px`, fontSize: '30px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{number}</span>
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
      <span style={{ position: 'absolute', top: `${randomOffset(57)}px`, left: `${randomOffset(131)}px`, fontSize: '15px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{truncatedHash}</span>
      <span style={{ position: 'absolute', top: `${randomOffset(82)}px`, left: `${randomOffset(150)}px`, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{playerNumber}</span>
      <span style={{ position: 'absolute', top: `${randomOffset(124)}px`, left: `${randomOffset(172)}px`, fontSize: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{round}</span>
      <span style={{ position: 'absolute', top: `${randomOffset(144)}px`, left: `${randomOffset(130)}px`, fontSize: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{currentTime}</span>
      <span style={{ position: 'absolute', top: `${randomOffset(101)}px`, left: `${randomOffset(62)}px`, fontSize: '30px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)', opacity: 0.9, transform: `rotate(${randomRotate()}deg)` }}>{number}</span>
    </div>,
    {
      width: 300,
      height: 200,
      fonts: [{ name: 'Roboto', data: fontData, weight: 400, style: 'normal' }],
    }
  );
}