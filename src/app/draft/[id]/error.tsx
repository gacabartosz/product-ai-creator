'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DraftError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Draft page error:', error);
  }, [error]);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card padding="lg" className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Wystapil blad
          </h2>

          <p className="text-gray-600 mb-6">
            Nie udalo sie zaladowac strony draftu. Sprobuj ponownie lub wróc na strone glowna.
          </p>

          {error.message && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
              <p className="text-sm font-medium text-red-800 mb-1">Szczególy bledu:</p>
              <p className="text-sm text-red-700 font-mono">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-red-500 mt-2">ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wróc na strone glowna
            </Button>

            <Button variant="primary" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sprobuj ponownie
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
