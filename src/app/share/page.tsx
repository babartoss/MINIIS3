// Modified: src/app/share/page.tsx
// Changes:
// - Removed contract from imageUrl, pageUrl, and description

import { Metadata, ResolvingMetadata } from 'next';
import ClientSharePage from './ClientSharePage';

type Props = {
  params: Promise<{}>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export async function generateMetadata(
  { searchParams }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParamsResolved = await searchParams;
  const number = searchParamsResolved.number || '00';
  const round = searchParamsResolved.round || '1';
  const player = searchParamsResolved.player || '';
  const txHash = searchParamsResolved.txHash || '';
  const appUrl = process.env.NEXT_PUBLIC_URL || 'https://your-app-url.vercel.app';
  const imageUrl = `${appUrl}/api/ticket-image?number=${number}&round=${round}&player=${encodeURIComponent(player)}&txHash=${txHash}`;
  const pageUrl = `${appUrl}/share?number=${number}&round=${round}&player=${encodeURIComponent(player)}&txHash=${txHash}`;
  const homeUrl = appUrl;

  const embedJson = JSON.stringify({
    version: "1",
    imageUrl: imageUrl,
    button: {
      title: "Try Your Luck",
      action: {
        type: "launch_frame",
        url: homeUrl,
        name: "MINIIS3",
        splashImageUrl: `${appUrl}/splash.png`,
        splashBackgroundColor: "#f5f0ec"
      }
    }
  });

  return {
    openGraph: {
      title: 'MINIIS3 Ticket',
      description: `Player: ${player}, Number: ${number}, Round: ${round}`,
      images: [imageUrl],
      url: pageUrl,
    },
    other: {
      'fc:miniapp': embedJson,
      'fc:frame': embedJson,
    }
  };
}

export default async function SharePage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  return <ClientSharePage searchParams={searchParams} />;
}