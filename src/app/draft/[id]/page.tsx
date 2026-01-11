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
  Edit3,
  Check,
  X,
  Loader2,
  ImageIcon,
  FileText,
  Package,
  ExternalLink,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MtlProductTable, LANGUAGES } from '@/components/MtlProductTable';
import type { LanguageCode } from '@/components/MtlProductTable';
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

  // Get language from draft
  const currentLang = ((draft?.rawData as Record<string, unknown>)?.language as LanguageCode) || 'de';
  const langConfig = LANGUAGES[currentLang] || LANGUAGES.de;

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

    try {
      const response = await fetch(apiUrl(`/api/publish/${draft.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          options: { language: currentLang },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Blad publikacji');
      }

      toast.success('Produkt opublikowany pomyslnie!');
      fetchDraft();
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

  // Handle field change from MtlProductTable
  const handleFieldChange = (field: string, value: string) => {
    if (field === 'name') {
      setEditedProduct(prev => ({ ...prev, name: value }));
    } else if (field === 'description.short') {
      setEditedProduct(prev => ({
        ...prev,
        description: { ...prev?.description, short: value } as any,
      }));
    } else if (field === 'description.long') {
      setEditedProduct(prev => ({
        ...prev,
        description: { ...prev?.description, long: value } as any,
      }));
    } else if (field === 'seo.title') {
      setEditedProduct(prev => ({
        ...prev,
        seo: { ...prev?.seo, title: value } as any,
      }));
    } else if (field === 'seo.description') {
      setEditedProduct(prev => ({
        ...prev,
        seo: { ...prev?.seo, description: value } as any,
      }));
    } else if (field === 'seo.keywords') {
      setEditedProduct(prev => ({
        ...prev,
        seo: {
          ...prev?.seo,
          keywords: value ? value.split(',').map((k: string) => k.trim()) : [],
        } as any,
      }));
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
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto">
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
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-6">
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
                <span className="text-2xl">{langConfig.flag}</span>
                <span className="text-sm text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(draft.createdAt).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'short',
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left column - Images & Pipeline */}
          <div className="lg:col-span-1 space-y-6">
            {/* Images */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  Zdjecia ({draft.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {draft.images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `Zdjecie ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 150px"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Control */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(isPipelineRunning || pipelineResult) && (
                  <div className="space-y-2">
                    <PipelineStageRow
                      label="Vision"
                      status={isPipelineRunning && !pipelineResult ? 'running' : pipelineResult?.stages.vision.status || 'pending'}
                      duration={pipelineResult?.stages.vision.durationMs}
                    />
                    <PipelineStageRow
                      label="Content"
                      status={isPipelineRunning && !pipelineResult ? 'pending' : pipelineResult?.stages.content.status || 'pending'}
                      duration={pipelineResult?.stages.content.durationMs}
                    />
                    <PipelineStageRow
                      label="Validation"
                      status={isPipelineRunning && !pipelineResult ? 'pending' : pipelineResult?.stages.validation.status || 'pending'}
                      duration={pipelineResult?.stages.validation.durationMs}
                    />
                  </div>
                )}

                {pipelineResult?.totalDurationMs && (
                  <p className="text-xs text-gray-500">
                    Czas: {(pipelineResult.totalDurationMs / 1000).toFixed(1)}s
                  </p>
                )}

                {draft.errorMessage && (
                  <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-700">{draft.errorMessage}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="primary"
                  className="w-full"
                  size="sm"
                  onClick={runPipeline}
                  isLoading={isPipelineRunning}
                  disabled={isPipelineRunning || draft.status === 'PROCESSING'}
                >
                  {isPipelineRunning ? 'Przetwarzanie...' : draft.product ? (
                    <><RefreshCw className="w-4 h-4 mr-2" />Regeneruj</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" />Uruchom</>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Publish Panel */}
            {draft.product && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Send className="w-4 h-4 text-green-500" />
                    Publikacja
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {draft.publishLogs.length > 0 && (
                    <div className="space-y-2">
                      {draft.publishLogs.slice(0, 3).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {log.status === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="capitalize">{log.platform}</span>
                          </div>
                          {log.externalUrl && (
                            <a href={log.externalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="primary"
                    className="w-full"
                    size="sm"
                    onClick={() => publishToPlatform('prestashop')}
                    isLoading={isPublishing}
                    disabled={isPublishing || (draft.status !== 'READY' && draft.status !== 'PUBLISHED')}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publikuj
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Right column - MTL Product Data */}
          <div className="lg:col-span-3">
            {draft.product ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-500" />
                        Dane produktu
                      </CardTitle>
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
                        <span className="text-lg">{langConfig.flag}</span>
                        <span className="text-sm font-medium text-blue-700">
                          {langConfig.name} (ID: {langConfig.id})
                        </span>
                      </div>
                    </div>
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
                <CardContent>
                  {/* MTL Table */}
                  <MtlProductTable
                    product={draft.product}
                    editedProduct={editedProduct}
                    isEditing={isEditing}
                    language={currentLang}
                    onFieldChange={handleFieldChange}
                  />

                  {/* Additional Info */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Package className="w-3 h-3" />
                        Cena brutto
                      </div>
                      <p className="text-lg font-bold">
                        {draft.product.pricing.gross.toFixed(2)} {draft.product.pricing.currency}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-500 text-xs mb-1">Cena netto</div>
                      <p className="text-lg font-semibold">
                        {draft.product.pricing.net.toFixed(2)} {draft.product.pricing.currency}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-500 text-xs mb-1">VAT</div>
                      <p className="text-lg font-semibold">{draft.product.pricing.vatRate}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-gray-500 text-xs mb-1">Stan mag.</div>
                      <p className="text-lg font-semibold">{draft.product.stock.quantity} szt.</p>
                    </div>
                  </div>

                  {/* Attributes */}
                  {draft.product.attributes && Object.keys(draft.product.attributes).length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3 text-sm text-gray-700">Atrybuty produktu</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(draft.product.attributes).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            {key}: <strong>{value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* No product yet */
              <Card padding="lg" className="text-center h-full flex items-center justify-center">
                <div className="py-12">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Brak danych produktu</h3>
                  <p className="text-gray-500 mb-4">
                    Uruchom Pipeline AI aby wygenerowac dane
                  </p>
                  <Button onClick={runPipeline} isLoading={isPipelineRunning}>
                    <Play className="w-4 h-4 mr-2" />
                    Uruchom Pipeline
                  </Button>
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
    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs">
      <div className="flex items-center gap-2">
        {status === 'pending' && <div className="w-3 h-3 rounded-full bg-gray-300" />}
        {status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
        {status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
        {status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
        <span>{label}</span>
      </div>
      {duration && <span className="text-gray-400">{(duration / 1000).toFixed(1)}s</span>}
    </div>
  );
}
