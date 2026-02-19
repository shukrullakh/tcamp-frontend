import { Navbar } from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
        {children}
      </main>
      <footer className="border-t py-8 bg-background/50 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© 2024 TalabaCampus. Empowering students with shared knowledge.</p>
        </div>
      </footer>
    </div>
  );
}
