import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">C.H.A.N.G.E. Platform</h1>
          <p className="text-muted-foreground">Business Formation & Advisory System</p>
        </div>
        {children}
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} C.H.A.N.G.E. Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
