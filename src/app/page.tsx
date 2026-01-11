'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Sparkles, Package, Upload, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ImageUploader';

export default function Home() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [userHint, setUserHint] = useState('');
  const [rawData, setRawData] = useState({
    ean: '',
    priceGross: '',
    brand: '',
  });

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);

    try {
      const formData = new FormData();

      // Add files
      files.forEach(file => {
        formData.append('images', file);
      });

      // Add optional data
      if (userHint.trim()) {
        formData.append('userHint', userHint.trim());
      }

      const rawDataClean = {
        ...(rawData.ean && { ean: rawData.ean }),
        ...(rawData.priceGross && { priceGross: parseFloat(rawData.priceGross) }),
        ...(rawData.brand && { brand: rawData.brand }),
      };

      if (Object.keys(rawDataClean).length > 0) {
        formData.append('rawData', JSON.stringify(rawDataClean));
      }

      // Upload
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      toast.success('Zdjecia przeslane pomyslnie!');

      // Redirect to draft page
      router.push(`/draft/${data.draft.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Blad podczas przesylania');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Product Creation
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Product AI Creator
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Przeslij zdjecia produktu, a AI wygeneruje pelny opis, SEO i opublikuje
            na Twoj sklep PrestaShop.
          </p>
        </div>

        {/* Upload Card */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Przeslij zdjecia produktu
            </CardTitle>
            <CardDescription>
              Wrzuc od 1 do 10 zdjec produktu. AI przeanalizuje je i wygeneruje
              tresc.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <ImageUploader
              onUpload={handleUpload}
              maxFiles={10}
              disabled={isUploading}
            />

            {/* Optional fields */}
            <div className="crystal-divider" />

            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Dodatkowe informacje (opcjonalne)
              </h3>

              <Textarea
                label="Podpowiedz dla AI"
                placeholder="np. Buty Nike Air Max 90, rozmiar 42, kolor czarny"
                value={userHint}
                onChange={e => setUserHint(e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Kod EAN"
                  placeholder="5901234567890"
                  value={rawData.ean}
                  onChange={e => setRawData(prev => ({ ...prev, ean: e.target.value }))}
                />

                <Input
                  label="Cena brutto (PLN)"
                  type="number"
                  placeholder="299.00"
                  value={rawData.priceGross}
                  onChange={e => setRawData(prev => ({ ...prev, priceGross: e.target.value }))}
                />

                <Input
                  label="Marka"
                  placeholder="Nike"
                  value={rawData.brand}
                  onChange={e => setRawData(prev => ({ ...prev, brand: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="md" className="text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-semibold mb-1">AI Vision</h3>
            <p className="text-sm text-gray-500">
              Automatyczne rozpoznawanie produktu ze zdjec
            </p>
          </Card>

          <Card padding="md" className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold mb-1">Generowanie tresci</h3>
            <p className="text-sm text-gray-500">
              Opisy, SEO, atrybuty - wszystko wygenerowane przez AI
            </p>
          </Card>

          <Card padding="md" className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <ArrowRight className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold mb-1">Publikacja</h3>
            <p className="text-sm text-gray-500">
              Jednym kliknieciem na PrestaShop, WooCommerce, Allegro
            </p>
          </Card>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 py-4">
          <p>Product AI Creator by Bartosz Gaca</p>
          <p className="text-xs mt-1">
            Powered by Google AI (Gemma 3) + OpenRouter (Llama 3.3)
          </p>
        </footer>
      </div>
    </main>
  );
}
