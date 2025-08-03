import { Metadata, ResolvingMetadata } from 'next';
import ClientSharePage from './ClientSharePage';

type Props = {
  params: Promise<Record<string, unknown>>;
  searchParams: Promise<Record<string, string | string[]>>;
}

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
};

export async function generateMetadata(
  { searchParams }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const searchParamsResolved = await searchParams;
  const number = getParam(searchParamsResolved.number) || '00';
  const round = getParam(searchParamsResolved.round) || '1';
  const player = getParam(searchParamsResolved.player);
  const txHash = getParam(searchParamsResolved.txHash);
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