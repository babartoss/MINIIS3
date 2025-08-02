import type { Metadata } from 'next';
import { getSession } from '@/auth';  // Sửa path: Thay ~ thành @
import '@/app/globals.css';  // Giữ nguyên
import { Providers } from '@/app/providers';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';  // Sửa path: Thay ~ thành @

// Metadata ứng dụng (thay title/description nếu cần)
export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();  

  return (
    <html lang="en">
      <body>
        <Providers session={session}>  
          {children}
        </Providers>
      </body>
    </html>
  );
}