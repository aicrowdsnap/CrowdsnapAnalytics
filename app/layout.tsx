import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import { ThemeProvider } from '@/components/ThemeContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="relative min-h-screen font-body antialiased overflow-x-hidden">
        {/* Background Ambient Field Layer */}
        <div aria-hidden className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-100">
          <div className="blob absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-neon-lime/10 blur-[130px]" />
          <div
            className="blob absolute top-1/3 -right-40 w-[28rem] h-[28rem] rounded-full bg-neon-teal/10 blur-[130px]"
            style={{ animationDelay: '-7s' }}
          />
          <div
            className="blob absolute bottom-[-10%] left-1/4 w-[26rem] h-[26rem] rounded-full bg-neon-green/10 blur-[130px]"
            style={{ animationDelay: '-13s' }}
          />
          <div className="absolute inset-0 bg-void/40" />
        </div>

        <ThemeProvider>
          <AuthProvider>
            <div className="relative z-10">{children}</div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}