'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Sparkles, Package, Upload, ArrowRight, List, Globe, Ruler, TreePine,
  Play, Loader2, CheckCircle2, AlertCircle, Edit3, Send, Eye, X, Check,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ImageUploader } from '@/components/ImageUploader';
import { LanguagePicker, DEFAULT_LANGUAGES, type Language } from '@/components/LanguagePicker';
import { apiUrl } from '@/lib/utils';
import type { UnifiedProduct } from '@/types/unified-product';

// Kategorie produktow
const PRODUCT_CATEGORIES = [
  { value: '', label: 'Wybierz kategorie...' },
  { value: 'maty-wiklinowe', label: 'Maty wiklinowe i akcesoria' },
  { value: 'ploty-sztachetowe', label: 'Ploty sztachetowe i akcesoria' },
  { value: 'materace', label: 'Materace' },
  { value: 'lozka', label: 'Lozka' },
  { value: 'poduszki', label: 'Poduszki na zewnatrz' },
  { value: 'meble-ogrodowe', label: 'Meble ogrodowe' },
  { value: 'inne', label: 'Inne' },
];

type PipelineStage = 'idle' | 'uploading' | 'vision' | 'content' | 'validation' | 'completed' | 'failed';

interface PipelineProgress {
  stage: PipelineStage;
  visionDone: boolean;
  contentDone: boolean;
  validationDone: boolean;
  error?: string;
}

export default function Home() {
  const router = useRouter();

  // Form state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [userHint, setUserHint] = useState('');
  const [language, setLanguage] = useState('de');
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [rawData, setRawData] = useState({
    ean: '',
    priceGross: '',
    brand: '',
    category: '',
    material: '',
    height: '',
    length: '',
    width: '',
  });

  // Pipeline state
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress>({
    stage: 'idle',
    visionDone: false,
    contentDone: false,
    validationDone: false,
  });
  const [draftId, setDraftId] = useState<string | null>(null);
  const [product, setProduct] = useState<UnifiedProduct | null>(null);
  const [editedProduct, setEditedProduct] = useState<UnifiedProduct | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Currency based on language
  const currency = language === 'de' ? 'EUR' : 'PLN';

  // Fetch available languages from PrestaShop (runs once on mount)
  useEffect(() => {
    async function fetchLanguages() {
      try {
        const response = await fetch(apiUrl('/api/prestashop/languages'));
        if (response.ok) {
          const data = await response.json();
          if (data.languages && data.languages.length > 0) {
            setLanguages(data.languages);
            // Check if current language exists in fetched list
            setLanguage(prev => {
              if (!data.languages.find((l: Language) => l.isoCode === prev)) {
                return data.languages[0].isoCode;
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.warn('Failed to fetch languages, using defaults:', error);
      }
    }
    fetchLanguages();
  }, []);

  // Handle files selected (not uploaded yet)
  const handleFilesSelected = useCallback((files: File[]) => {
    setUploadedFiles(files);
  }, []);

  // Run the full pipeline
  const runPipeline = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Dodaj przynajmniej jedno zdjecie');
      return;
    }

    // Reset state
    setPipelineProgress({ stage: 'uploading', visionDone: false, contentDone: false, validationDone: false });
    setProduct(null);
    setEditedProduct(null);
    setDraftId(null);

    try {
      // Step 1: Upload images
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('images', file);
      });

      if (userHint.trim()) {
        formData.append('userHint', userHint.trim());
      }

      formData.append('language', language);

      const rawDataClean = {
        ...(rawData.ean && { ean: rawData.ean }),
        ...(rawData.priceGross && { priceGross: parseFloat(rawData.priceGross), currency }),
        ...(rawData.brand && { brand: rawData.brand }),
        ...(rawData.category && { category: rawData.category }),
        ...(rawData.material && { material: rawData.material }),
        ...(rawData.height && { height: rawData.height }),
        ...(rawData.length && { length: rawData.length }),
        ...(rawData.width && { width: rawData.width }),
        language,
        currency,
      };

      formData.append('rawData', JSON.stringify(rawDataClean));

      const uploadResponse = await fetch(apiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      setDraftId(uploadData.draft.id);
      toast.success('Zdjecia przeslane!');

      // Step 2: Run AI Pipeline
      setPipelineProgress(prev => ({ ...prev, stage: 'vision' }));

      const pipelineResponse = await fetch(apiUrl('/api/pipeline'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: uploadData.draft.id }),
      });

      const pipelineData = await pipelineResponse.json();

      if (!pipelineResponse.ok) {
        throw new Error(pipelineData.error || 'Pipeline failed');
      }

      // Update progress based on result
      setPipelineProgress({
        stage: 'completed',
        visionDone: pipelineData.pipelineResult?.stages?.vision?.status === 'completed',
        contentDone: pipelineData.pipelineResult?.stages?.content?.status === 'completed',
        validationDone: pipelineData.pipelineResult?.stages?.validation?.status === 'completed',
      });

      if (pipelineData.draft?.product) {
        // Apply currency from settings
        const productWithCurrency = {
          ...pipelineData.draft.product,
          pricing: {
            ...pipelineData.draft.product.pricing,
            currency: currency,
          }
        };
        setProduct(productWithCurrency);
        setEditedProduct(productWithCurrency);
        toast.success('Produkt wygenerowany!');
      }

    } catch (error) {
      setPipelineProgress(prev => ({
        ...prev,
        stage: 'failed',
        error: error instanceof Error ? error.message : 'Nieznany blad'
      }));
      toast.error(error instanceof Error ? error.message : 'Blad pipeline');
    }
  };

  // Save edited product
  const saveProduct = async () => {
    if (!draftId || !editedProduct) return;

    try {
      const response = await fetch(apiUrl(`/api/drafts/${draftId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: editedProduct }),
      });

      if (!response.ok) {
        throw new Error('Blad zapisu');
      }

      setProduct(editedProduct);
      setIsEditing(false);
      toast.success('Zmiany zapisane!');
    } catch (error) {
      toast.error('Blad podczas zapisywania');
    }
  };

  // Publish to PrestaShop
  const publishProduct = async () => {
    if (!draftId) return;

    setIsPublishing(true);

    try {
      const response = await fetch(apiUrl(`/api/publish/${draftId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'prestashop',
          options: { language },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Blad publikacji');
      }

      toast.success('Produkt opublikowany na sklepie!');

      // Optionally redirect to draft page
      router.push(`/draft/${draftId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Blad publikacji');
    } finally {
      setIsPublishing(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setUploadedFiles([]);
    setUserHint('');
    setRawData({
      ean: '',
      priceGross: '',
      brand: '',
      category: '',
      material: '',
      height: '',
      length: '',
      width: '',
    });
    setPipelineProgress({ stage: 'idle', visionDone: false, contentDone: false, validationDone: false });
    setDraftId(null);
    setProduct(null);
    setEditedProduct(null);
    setIsEditing(false);
  };

  const isPipelineRunning = ['uploading', 'vision', 'content', 'validation'].includes(pipelineProgress.stage);
  const isPipelineCompleted = pipelineProgress.stage === 'completed';

  return (
    <main className="min-h-screen p-4 md:p-8 relative">
      {/* Animated floating orbs - Enhanced */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />
      <div className="floating-orb floating-orb-4" />
      <div className="floating-orb floating-orb-5" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-md border border-white/40 text-sm font-medium text-gray-700 shadow-lg">
            <Sparkles className="w-4 h-4 text-blue-500" />
            AI-Powered Product Creation
          </div>

          <h1 className="text-4xl md:text-5xl font-bold gradient-text tracking-tight">
            Product Creator
          </h1>

          <p className="text-gray-500 max-w-md mx-auto">
            Wgraj zdjecia produktu, a AI wygeneruje opisy, SEO i wszystko co potrzebujesz
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push('/drafts')}
            >
              <List className="w-4 h-4 mr-2" />
              Wszystkie drafty
            </Button>
            {(product || draftId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Nowy produkt
              </Button>
            )}
          </div>
        </div>

        {/* Main content - two columns on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Upload & Settings */}
          <div className="space-y-6">
            {/* Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" />
                  1. Zdjecia produktu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onUpload={handleFilesSelected}
                  maxFiles={10}
                  disabled={isPipelineRunning}
                />
              </CardContent>
            </Card>

            {/* Language & Price */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  2. Jezyk i waluta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <LanguagePicker
                  value={language}
                  onChange={setLanguage}
                  languages={languages}
                  label=""
                  disabled={isPipelineRunning}
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="info">{currency}</Badge>
                  <span>Waluta: {language === 'de' ? 'Euro' : 'Zloty'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Optional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  3. Informacje (opcjonalne)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={rawData.category}
                  onChange={e => setRawData(prev => ({ ...prev, category: e.target.value }))}
                  className="crystal-input py-2 w-full"
                  disabled={isPipelineRunning}
                >
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <Textarea
                  label="Podpowiedz dla AI"
                  placeholder="np. Mata wiklinowa 120x500cm, naturalna wiklina"
                  value={userHint}
                  onChange={e => setUserHint(e.target.value)}
                  disabled={isPipelineRunning}
                />

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Wys. (cm)"
                    placeholder="120"
                    value={rawData.height}
                    onChange={e => setRawData(prev => ({ ...prev, height: e.target.value }))}
                    disabled={isPipelineRunning}
                  />
                  <Input
                    label="Dlug. (cm)"
                    placeholder="500"
                    value={rawData.length}
                    onChange={e => setRawData(prev => ({ ...prev, length: e.target.value }))}
                    disabled={isPipelineRunning}
                  />
                  <Input
                    label="Szer. (cm)"
                    placeholder="80"
                    value={rawData.width}
                    onChange={e => setRawData(prev => ({ ...prev, width: e.target.value }))}
                    disabled={isPipelineRunning}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Material"
                    placeholder="wiklina, drewno"
                    value={rawData.material}
                    onChange={e => setRawData(prev => ({ ...prev, material: e.target.value }))}
                    disabled={isPipelineRunning}
                  />
                  <Input
                    label="Marka"
                    placeholder="Roysson"
                    value={rawData.brand}
                    onChange={e => setRawData(prev => ({ ...prev, brand: e.target.value }))}
                    disabled={isPipelineRunning}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="EAN"
                    placeholder="5903672416931"
                    value={rawData.ean}
                    onChange={e => setRawData(prev => ({ ...prev, ean: e.target.value }))}
                    disabled={isPipelineRunning}
                  />
                  <Input
                    label={`Cena (${currency})`}
                    type="number"
                    placeholder={currency === 'EUR' ? '29.90' : '129.00'}
                    value={rawData.priceGross}
                    onChange={e => setRawData(prev => ({ ...prev, priceGross: e.target.value }))}
                    disabled={isPipelineRunning}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Pipeline & Results */}
          <div className="space-y-6">
            {/* Pipeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  4. Uruchom AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pipeline stages */}
                <div className="space-y-2">
                  <PipelineStageRow
                    label="Przesylanie zdjec"
                    status={
                      pipelineProgress.stage === 'uploading' ? 'running' :
                      pipelineProgress.stage !== 'idle' ? 'completed' : 'pending'
                    }
                  />
                  <PipelineStageRow
                    label="Analiza obrazu (Vision AI)"
                    status={
                      pipelineProgress.stage === 'vision' ? 'running' :
                      pipelineProgress.visionDone ? 'completed' : 'pending'
                    }
                  />
                  <PipelineStageRow
                    label="Generowanie tresci"
                    status={
                      pipelineProgress.stage === 'content' ? 'running' :
                      pipelineProgress.contentDone ? 'completed' : 'pending'
                    }
                  />
                  <PipelineStageRow
                    label="Walidacja"
                    status={
                      pipelineProgress.stage === 'validation' ? 'running' :
                      pipelineProgress.validationDone ? 'completed' : 'pending'
                    }
                  />
                </div>

                {pipelineProgress.error && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700">{pipelineProgress.error}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={runPipeline}
                  disabled={isPipelineRunning || uploadedFiles.length === 0}
                  isLoading={isPipelineRunning}
                >
                  {isPipelineRunning ? (
                    'Przetwarzanie...'
                  ) : isPipelineCompleted ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Uruchom ponownie
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Uruchom AI
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Generated Product */}
            {product && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      5. Wygenerowany produkt
                    </CardTitle>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedProduct(product); }}>
                            <X className="w-4 h-4 mr-1" />
                            Anuluj
                          </Button>
                          <Button size="sm" variant="primary" onClick={saveProduct}>
                            <Check className="w-4 h-4 mr-1" />
                            Zapisz
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edytuj
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nazwa produktu</label>
                    {isEditing ? (
                      <Input
                        value={editedProduct?.name || ''}
                        onChange={e => setEditedProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    ) : (
                      <p className="font-semibold">{product.name}</p>
                    )}
                  </div>

                  {/* Short description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Krotki opis</label>
                    {isEditing ? (
                      <Textarea
                        value={editedProduct?.description?.short || ''}
                        onChange={e => setEditedProduct(prev => prev ? {
                          ...prev,
                          description: { ...prev.description, short: e.target.value }
                        } : null)}
                        className="min-h-[80px]"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description?.short}</p>
                    )}
                  </div>

                  {/* Long description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Dlugi opis (HTML)</label>
                    {isEditing ? (
                      <Textarea
                        value={editedProduct?.description?.long || ''}
                        onChange={e => setEditedProduct(prev => prev ? {
                          ...prev,
                          description: { ...prev.description, long: e.target.value }
                        } : null)}
                        className="min-h-[150px] font-mono text-xs"
                      />
                    ) : (
                      <div className="text-sm text-gray-600 max-h-48 overflow-y-auto prose prose-sm border rounded-lg p-3 bg-gray-50">
                        <div dangerouslySetInnerHTML={{ __html: product.description?.long || '' }} />
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Cennik</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Cena brutto ({editedProduct?.pricing?.currency || currency})
                        </label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editedProduct?.pricing?.gross || ''}
                            onChange={e => setEditedProduct(prev => prev ? {
                              ...prev,
                              pricing: {
                                ...prev.pricing,
                                gross: parseFloat(e.target.value) || 0,
                                net: (parseFloat(e.target.value) || 0) / (1 + (prev.pricing?.vatRate || 23) / 100)
                              }
                            } : null)}
                          />
                        ) : (
                          <p className="font-bold text-lg text-green-600">
                            {product.pricing?.gross?.toFixed(2)} {product.pricing?.currency || currency}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">VAT (%)</label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedProduct?.pricing?.vatRate || 23}
                            onChange={e => setEditedProduct(prev => prev ? {
                              ...prev,
                              pricing: {
                                ...prev.pricing,
                                vatRate: parseInt(e.target.value) || 23,
                                net: (prev.pricing?.gross || 0) / (1 + (parseInt(e.target.value) || 23) / 100)
                              }
                            } : null)}
                          />
                        ) : (
                          <p className="text-sm">{product.pricing?.vatRate || 23}%</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEO */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">SEO</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Tytul SEO <span className="text-gray-400">({(editedProduct?.seo?.title || '').length}/70)</span>
                        </label>
                        {isEditing ? (
                          <Input
                            value={editedProduct?.seo?.title || ''}
                            onChange={e => setEditedProduct(prev => prev ? {
                              ...prev,
                              seo: { ...prev.seo, title: e.target.value }
                            } : null)}
                            maxLength={70}
                          />
                        ) : (
                          <p className="text-sm">{product.seo?.title}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Opis SEO <span className="text-gray-400">({(editedProduct?.seo?.description || '').length}/160)</span>
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={editedProduct?.seo?.description || ''}
                            onChange={e => setEditedProduct(prev => prev ? {
                              ...prev,
                              seo: { ...prev.seo, description: e.target.value }
                            } : null)}
                            maxLength={160}
                            className="min-h-[60px]"
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{product.seo?.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Identifiers & Brand */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Identyfikatory</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">EAN</label>
                        {isEditing ? (
                          <Input
                            value={editedProduct?.identifiers?.ean || ''}
                            onChange={e => setEditedProduct(prev => prev ? {
                              ...prev,
                              identifiers: { ...prev.identifiers, ean: e.target.value }
                            } : null)}
                            placeholder="5903672416931"
                          />
                        ) : (
                          <p className="text-sm">{product.identifiers?.ean || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Marka</label>
                        {isEditing ? (
                          <Input
                            value={editedProduct?.brand || ''}
                            onChange={e => setEditedProduct(prev => prev ? {
                              ...prev,
                              brand: e.target.value
                            } : null)}
                            placeholder="Roysson"
                          />
                        ) : (
                          <p className="text-sm">{product.brand || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="border-t pt-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tagi <span className="text-gray-400">(oddzielone przecinkami)</span>
                    </label>
                    {isEditing ? (
                      <Input
                        value={(editedProduct?.tags || []).join(', ')}
                        onChange={e => setEditedProduct(prev => prev ? {
                          ...prev,
                          tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        } : null)}
                        placeholder="mata, wiklina, ogrod"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(product.tags || []).map((tag, i) => (
                          <Badge key={i} variant="default" className="text-xs">{tag}</Badge>
                        ))}
                        {(!product.tags || product.tags.length === 0) && (
                          <span className="text-sm text-gray-400">Brak tagow</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/draft/${draftId}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Pelny podglad
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={publishProduct}
                    isLoading={isPublishing}
                    disabled={isPublishing || isEditing}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publikuj na sklepie
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Info cards when no product */}
            {!product && !isPipelineRunning && (
              <Card padding="md" className="bg-gray-50">
                <h3 className="font-semibold mb-3 text-gray-700">Jak to dziala:</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500">1.</span>
                    Dodaj zdjecia produktu
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500">2.</span>
                    Wybierz jezyk (DE = EUR, PL = PLN)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500">3.</span>
                    Opcjonalnie uzupelnij dane
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500">4.</span>
                    Kliknij &quot;Uruchom AI&quot;
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-500">5.</span>
                    Sprawdz, edytuj i publikuj!
                  </li>
                </ol>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 py-4">
          <p>Product Creator by Bartosz Gaca</p>
        </footer>
      </div>
    </main>
  );
}

// Pipeline Stage Row Component - Enhanced
function PipelineStageRow({
  label,
  status,
}: {
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}) {
  return (
    <div className={`
      flex items-center justify-between p-3 rounded-xl transition-all duration-300
      ${status === 'running'
        ? 'bg-gradient-to-r from-blue-50/80 to-blue-100/50 border border-blue-200/50 shadow-sm'
        : status === 'completed'
        ? 'bg-gradient-to-r from-green-50/80 to-green-100/50 border border-green-200/50'
        : status === 'failed'
        ? 'bg-gradient-to-r from-red-50/80 to-red-100/50 border border-red-200/50'
        : 'bg-gray-50/80 border border-gray-100'
      }
    `}>
      <div className="flex items-center gap-3">
        {status === 'pending' && (
          <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-gray-300" />
        )}
        {status === 'running' && (
          <div className="relative">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <div className="absolute inset-0 w-5 h-5 rounded-full bg-blue-400/20 animate-ping" />
          </div>
        )}
        {status === 'completed' && (
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
        )}
        {status === 'failed' && (
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
        )}
        <span className={`text-sm font-medium ${
          status === 'running' ? 'text-blue-700' :
          status === 'completed' ? 'text-green-700' :
          status === 'failed' ? 'text-red-700' :
          'text-gray-600'
        }`}>{label}</span>
      </div>
    </div>
  );
}
