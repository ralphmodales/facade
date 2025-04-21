import { Suspense } from 'react';
import ChatInterface from '@/components/chat-interface';
import { Loader2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto">
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <ChatInterface />
        </Suspense>
      </div>
    </main>
  );
}

