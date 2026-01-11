'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  ArrowLeft,
  Play,
  RefreshCw,
  Send,
  Eye,
  Edit3,
  Check,
  X,
  Loader2,
  ImageIcon,
  FileText,
  Tag,
  Package,
  ExternalLink,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import type { UnifiedProduct } from '@/types/unified-product';
import { apiUrl } from '@/lib/utils';

// Types
interface DraftImage {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  position: number;
  alt: string | null;
}

interface PublishLog {
  id: string;
  platform: string;
  status: string;
  externalId: string | null;
  externalUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface Draft {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'FAILED';
  userHint: string | null;
  rawData: Record<string, unknown> | null;
  product: UnifiedProduct | null;
  visionAnalysis: Record<string, unknown> | null;
  errorMessage: string | null;
  images: DraftImage[];
  publishLogs: PublishLog[];
  createdAt: string;
  updatedAt: string;
}

interface PipelineStage {
  status: 'pending' | 'running' | 'completed' | 'failed';
  durationMs?: number;
  error?: string;
}

interface PipelineResult {
  status: 'completed' | 'partial' | 'failed';
  totalDurationMs: number;
  stages: {
    vision: PipelineStage;
    content: PipelineStage;
    validation: PipelineStage;
  };
  errors?: string[];
}

// Status badge variant mapping
const statusVariants: Record<Draft['status'], 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PENDING: 'default',
  PROCESSING: 'info',
  READY: 'success',
  PUBLISHED: 'success',
  FAILED: 'error',
};

const statusLabels: Record<Draft['status'], string> = {
  PENDING: 'Oczekuje',
  PROCESSING: 'Przetwarzanie',
  READY: 'Gotowy',
  PUBLISHED: 'Opublikowany',
  FAILED: 'Blad',
};

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  // State
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Partial<UnifiedProduct> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  // Fetch draft data
  const fetchDraft = useCallback(async () => {
    try {
      const response = await fetch(apiUrl(`/api/drafts/${draftId}`));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nie udalo sie pobrac draftu');
      }

      setDraft(data.draft);
      setEditedProduct(data.draft.product);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany blad');
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  // Run AI Pipeline
  const runPipeline = async () => {
    if (!draft) return;

    setIsPipelineRunning(true);
    setPipelineResult(null);

    try {
      const response = await fetch(apiUrl('/api/pipeline'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Blad pipeline');
      }

      setPipelineResult(data.pipelineResult);
      setDraft(data.draft);
      setEditedProduct(data.draft.product);

      if (data.pipelineResult.status === 'completed') {
        toast.success('Pipeline AI zakonczony pomyslnie!');
      } else if (data.pipelineResult.status === 'partial') {
        toast.warning('Pipeline czesciowo ukonczony - sprawdz wyniki');
      } else {
        toast.error('Pipeline zakonczony z bledami');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Blad pipeline');
    } finally {
      setIsPipelineRunning(false);
    }
  };

  // Publish to platform
  const publishToPlatform = async (platform: string = 'prestashop') => {
    if (!draft || draft.status !== 'READY' && draft.status !== 'PUBLISHED') {
      toast.error('Draft musi byc w statusie READY lub PUBLISHED');
      return;
    }

    setIsPublishing(true);

    // Get language from rawData
    const language = (draft.rawData as Record<string, unknown>)?.language as string || 'de';

    try {
      const response = await fetch(apiUrl(`/api/publish/${draft.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          options: { language },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Blad publikacji');
      }

      toast.success('Produkt opublikowany pomyslnie!');
      fetchDraft(); // Refresh to get new publish log
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Blad publikacji');
    } finally {
      setIsPublishing(false);
    }
  };

  // Save edited product
  const saveProduct = async () => {
    if (!draft || !editedProduct) return;

    setIsSaving(true);

    try {
      const response = await fetch(apiUrl(`/api/drafts/${draft.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: editedProduct }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Blad zapisu');
      }

      setDraft(data.draft);
      setIsEditing(false);
      toast.success('Zmiany zapisane!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Blad zapisu');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete draft
  const deleteDraft = async () => {
    if (!draft) return;

    if (!confirm('Czy na pewno chcesz usunac ten draft?')) return;

    try {
      const response = await fetch(apiUrl(`/api/drafts/${draft.id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Blad usuwania');
      }

      toast.success('Draft usuniety');
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Blad usuwania');
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !draft) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card padding="lg" className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Blad</h2>
            <p className="text-gray-600 mb-4">{error || 'Draft nie znaleziony'}</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wróc na strone glowna
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Wróc
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Draft #{draft.id.slice(-8)}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusVariants[draft.status]}>
                  {statusLabels[draft.status]}
                </Badge>
                <span className="text-sm text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(draft.createdAt).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={deleteDraft}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Usun
            </Button>
            <Button variant="outline" onClick={fetchDraft}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Odswiez
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Images & Pipeline */}
          <div className="lg:col-span-1 space-y-6">
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  Zdjecia ({draft.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {draft.images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `Zdjecie ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Pipeline
                </CardTitle>
                <CardDescription>
                  Uruchom pipeline AI aby wygenerowac dane produktu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pipeline stages */}
                {(isPipelineRunning || pipelineResult) && (
                  <div className="space-y-2">
                    <PipelineStageRow
                      label="Vision Analysis"
                      status={
                        isPipelineRunning && !pipelineResult
                          ? 'running'
                          : pipelineResult?.stages.vision.status || 'pending'
                      }
                      duration={pipelineResult?.stages.vision.durationMs}
                    />
                    <PipelineStageRow
                      label="Content Generation"
                      status={
                        isPipelineRunning && !pipelineResult
                          ? 'pending'
                          : pipelineResult?.stages.content.status || 'pending'
                      }
                      duration={pipelineResult?.stages.content.durationMs}
                    />
                    <PipelineStageRow
                      label="Validation"
                      status={
                        isPipelineRunning && !pipelineResult
                          ? 'pending'
                          : pipelineResult?.stages.validation.status || 'pending'
                      }
                      duration={pipelineResult?.stages.validation.durationMs}
                    />
                  </div>
                )}

                {pipelineResult?.totalDurationMs && (
                  <p className="text-sm text-gray-500">
                    Calkowity czas: {(pipelineResult.totalDurationMs / 1000).toFixed(1)}s
                  </p>
                )}

                {draft.errorMessage && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700">{draft.errorMessage}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={runPipeline}
                  isLoading={isPipelineRunning}
                  disabled={isPipelineRunning || draft.status === 'PROCESSING'}
                >
                  {isPipelineRunning ? (
                    'Przetwarzanie...'
                  ) : draft.product ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Uruchom ponownie
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Uruchom Pipeline
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* User Hint */}
            {draft.userHint && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Podpowiedz uzytkownika</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{draft.userHint}</p>
                </CardContent>
              </Card>
            )}

            {/* Language Info */}
            {draft.rawData && typeof (draft.rawData as Record<string, unknown>).language === 'string' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Jezyk produktu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const lang = (draft.rawData as Record<string, string>).language;
                    const flagMap: Record<string, string> = { de: '\u{1F1E9}\u{1F1EA}', pl: '\u{1F1F5}\u{1F1F1}', en: '\u{1F1EC}\u{1F1E7}' };
                    const nameMap: Record<string, string> = { de: 'Niemiecki', pl: 'Polski', en: 'Angielski' };
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{flagMap[lang] || '\u{1F310}'}</span>
                        <span className="font-medium">{nameMap[lang] || lang}</span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Raw Data */}
            {draft.rawData && Object.keys(draft.rawData).filter(k => k !== 'language').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dane wejsciowe</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-1 text-sm">
                    {Object.entries(draft.rawData)
                      .filter(([key]) => key !== 'language')
                      .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="text-gray-500">{key}:</dt>
                        <dd className="font-medium">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Product data */}
          <div className="lg:col-span-2 space-y-6">
            {draft.product ? (
              <>
                {/* Product Editor */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-500" />
                        Dane produktu
                      </CardTitle>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsEditing(false);
                                setEditedProduct(draft.product);
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Anuluj
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={saveProduct}
                              isLoading={isSaving}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Zapisz
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edytuj
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Name */}
                    <div>
                      {isEditing ? (
                        <Input
                          label="Nazwa produktu"
                          value={editedProduct?.name || ''}
                          onChange={(e) =>
                            setEditedProduct((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nazwa produktu
                          </label>
                          <p className="text-lg font-semibold">{draft.product.name}</p>
                        </>
                      )}
                    </div>

                    {/* Short description */}
                    <div>
                      {isEditing ? (
                        <Textarea
                          label="Krótki opis"
                          value={editedProduct?.description?.short || ''}
                          onChange={(e) =>
                            setEditedProduct((prev) => ({
                              ...prev,
                              description: { ...prev?.description, short: e.target.value } as any,
                            }))
                          }
                        />
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Krótki opis
                          </label>
                          <p className="text-gray-600">{draft.product.description.short}</p>
                        </>
                      )}
                    </div>

                    {/* Long description */}
                    <div>
                      {isEditing ? (
                        <Textarea
                          label="Dlugi opis"
                          className="min-h-[200px]"
                          value={editedProduct?.description?.long || ''}
                          onChange={(e) =>
                            setEditedProduct((prev) => ({
                              ...prev,
                              description: { ...prev?.description, long: e.target.value } as any,
                            }))
                          }
                        />
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dlugi opis
                          </label>
                          <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                            {draft.product.description.long}
                          </div>
                        </>
                      )}
                    </div>

                    {/* SEO */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        SEO
                      </h4>
                      <div className="space-y-3">
                        {isEditing ? (
                          <>
                            <Input
                              label="SEO Title"
                              value={editedProduct?.seo?.title || ''}
                              onChange={(e) =>
                                setEditedProduct((prev) => ({
                                  ...prev,
                                  seo: { ...prev?.seo, title: e.target.value } as any,
                                }))
                              }
                            />
                            <Textarea
                              label="SEO Description"
                              value={editedProduct?.seo?.description || ''}
                              onChange={(e) =>
                                setEditedProduct((prev) => ({
                                  ...prev,
                                  seo: { ...prev?.seo, description: e.target.value } as any,
                                }))
                              }
                            />
                            <Input
                              label="Keywords (oddzielone przecinkiem)"
                              value={(editedProduct?.seo?.keywords || []).join(', ')}
                              onChange={(e) =>
                                setEditedProduct((prev) => ({
                                  ...prev,
                                  seo: {
                                    ...prev?.seo,
                                    keywords: e.target.value ? e.target.value.split(',').map((k) => k.trim()) : [],
                                  } as any,
                                }))
                              }
                            />
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="block text-xs text-gray-500">Title</label>
                              <p className="text-sm">{draft.product.seo.title}</p>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Description</label>
                              <p className="text-sm">{draft.product.seo.description}</p>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Keywords</label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(draft.product.seo.keywords || []).map((keyword, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-gray-100 rounded text-xs"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Cena
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500">Brutto</label>
                          <p className="font-semibold">
                            {draft.product.pricing.gross.toFixed(2)} {draft.product.pricing.currency}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Netto</label>
                          <p className="text-sm">
                            {draft.product.pricing.net.toFixed(2)} {draft.product.pricing.currency}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">VAT</label>
                          <p className="text-sm">{draft.product.pricing.vatRate}%</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Stan</label>
                          <p className="text-sm">{draft.product.stock.quantity} szt.</p>
                        </div>
                      </div>
                    </div>

                    {/* Attributes */}
                    {draft.product.attributes && Object.keys(draft.product.attributes).length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Atrybuty</h4>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(draft.product.attributes).map(([key, value]) => (
                            <div key={key} className="flex">
                              <dt className="text-gray-500 mr-2">{key}:</dt>
                              <dd className="font-medium">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Publish Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-blue-500" />
                      Publikacja
                    </CardTitle>
                    <CardDescription>
                      Opublikuj produkt na platformach e-commerce
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Publish logs */}
                    {draft.publishLogs.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Historia publikacji</h4>
                        {draft.publishLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {log.status === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                              )}
                              <div>
                                <p className="font-medium capitalize">{log.platform}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(log.createdAt).toLocaleString('pl-PL')}
                                </p>
                              </div>
                            </div>
                            {log.externalUrl && (
                              <a
                                href={log.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => publishToPlatform('prestashop')}
                      isLoading={isPublishing}
                      disabled={
                        isPublishing ||
                        (draft.status !== 'READY' && draft.status !== 'PUBLISHED')
                      }
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Publikuj na PrestaShop
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (
              /* No product yet */
              <Card padding="lg" className="text-center">
                <div className="py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Brak danych produktu</h3>
                  <p className="text-gray-500">
                    Uzyj przycisku &quot;Uruchom Pipeline&quot; w panelu po lewej stronie, aby wygenerowac dane produktu
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Pipeline Stage Row Component
function PipelineStageRow({
  label,
  status,
  duration,
}: {
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
      <div className="flex items-center gap-2">
        {status === 'pending' && <div className="w-4 h-4 rounded-full bg-gray-300" />}
        {status === 'running' && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        )}
        {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        {status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
        <span className="text-sm">{label}</span>
      </div>
      {duration && (
        <span className="text-xs text-gray-500">{(duration / 1000).toFixed(1)}s</span>
      )}
    </div>
  );
}
