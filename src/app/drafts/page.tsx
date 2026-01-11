'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  ChevronRight,
  Clock,
  ImageIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { apiUrl } from '@/lib/utils';

// Types
interface DraftImage {
  id: string;
  url: string;
  filename: string;
}

interface PublishLog {
  id: string;
  platform: string;
  status: string;
  createdAt: string;
}

interface DraftListItem {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'FAILED';
  userHint: string | null;
  product: { name?: string } | null;
  images: DraftImage[];
  publishLogs: PublishLog[];
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Status mapping
const statusVariants: Record<DraftListItem['status'], 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  PENDING: 'default',
  PROCESSING: 'info',
  READY: 'success',
  PUBLISHED: 'success',
  FAILED: 'error',
};

const statusLabels: Record<DraftListItem['status'], string> = {
  PENDING: 'Oczekuje',
  PROCESSING: 'Przetwarzanie',
  READY: 'Gotowy',
  PUBLISHED: 'Opublikowany',
  FAILED: 'Blad',
};

const statusFilters = [
  { value: '', label: 'Wszystkie' },
  { value: 'PENDING', label: 'Oczekujace' },
  { value: 'PROCESSING', label: 'W trakcie' },
  { value: 'READY', label: 'Gotowe' },
  { value: 'PUBLISHED', label: 'Opublikowane' },
  { value: 'FAILED', label: 'Z bledem' },
];

export default function DraftsPage() {
  const router = useRouter();

  // State
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch drafts
  const fetchDrafts = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('limit', '50');

      const response = await fetch(apiUrl(`/api/drafts?${params.toString()}`));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Blad pobierania draftow');
      }

      setDrafts(data.drafts);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany blad');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts(statusFilter);
  }, [fetchDrafts, statusFilter]);

  // Delete draft
  const deleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Czy na pewno chcesz usunac ten draft?')) return;

    try {
      const response = await fetch(apiUrl(`/api/drafts/${id}`), { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Blad usuwania');
      }
      toast.success('Draft usuniety');
      fetchDrafts(statusFilter);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Blad usuwania');
    }
  };

  // Filter drafts by search query
  const filteredDrafts = drafts.filter((draft) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = draft.product?.name?.toLowerCase() || '';
    const hint = draft.userHint?.toLowerCase() || '';
    const id = draft.id.toLowerCase();
    return name.includes(query) || hint.includes(query) || id.includes(query);
  });

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drafty produktow</h1>
            <p className="text-gray-500">
              {pagination?.total || 0} {pagination?.total === 1 ? 'draft' : 'draftow'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fetchDrafts(statusFilter)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Odswiez
            </Button>
            <Button variant="primary" onClick={() => router.push('/')}>
              <Plus className="w-4 h-4 mr-2" />
              Nowy draft
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card padding="md">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Szukaj po nazwie, ID lub podpowiedzi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="crystal-input py-2"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card padding="lg" className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Blad</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchDrafts(statusFilter)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sprobuj ponownie
            </Button>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && filteredDrafts.length === 0 && (
          <Card padding="lg" className="text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Brak draftow</h2>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter
                ? 'Nie znaleziono draftow spelniajacych kryteria'
                : 'Przeslij zdjecia produktu aby utworzyc pierwszy draft'}
            </p>
            <Button variant="primary" onClick={() => router.push('/')}>
              <Plus className="w-4 h-4 mr-2" />
              Utworz nowy draft
            </Button>
          </Card>
        )}

        {/* Drafts list */}
        {!loading && !error && filteredDrafts.length > 0 && (
          <div className="space-y-3">
            {filteredDrafts.map((draft) => (
              <Card
                key={draft.id}
                padding="none"
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/draft/${draft.id}`)}
              >
                <div className="flex items-center p-4 gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {draft.images[0] ? (
                      <Image
                        src={draft.images[0].url}
                        alt={draft.product?.name || draft.userHint || `Miniatura draftu ${draft.id.slice(-8)}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">
                        {draft.product?.name || draft.userHint || `Draft #${draft.id.slice(-8)}`}
                      </h3>
                      <Badge variant={statusVariants[draft.status]}>
                        {statusLabels[draft.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(draft.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {draft.images.length} zdjec
                      </span>
                      {draft.publishLogs[0]?.status === 'success' && (
                        <span className="text-green-600">Opublikowano</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteDraft(draft.id, e)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Load more */}
        {pagination?.hasMore && !loading && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Implement pagination
                toast.info('Paginacja w przygotowaniu');
              }}
            >
              Zaladuj wiecej
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
