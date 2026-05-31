import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { VoiceChatPanel } from '@/components/chat/VoiceChatPanel';

export function VoicePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-700/50 bg-gray-800/40">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-lg font-semibold">Voice Chat with Hermes</h1>
          <span aria-hidden className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <p className="text-sm text-gray-400">
          Hold the button to speak. Release (or pause for ~1.5 seconds) to send your message.
          Hermes will reply with synthesized speech.
        </p>
        <VoiceChatPanel />
      </main>
    </div>
  );
}
