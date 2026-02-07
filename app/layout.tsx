import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dice Game - Play on Base',
  description: 'Roll the dice, test your luck on Base blockchain. Win up to 1.5x your stake!',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#667eea" />
      </head>
      <body>{children}</body>
    </html>
  );
}
