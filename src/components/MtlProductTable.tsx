'use client';

import {
  Type,
  AlignLeft,
  FileText,
  Link2,
  Tag,
  Hash,
} from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import type { UnifiedProduct } from '@/types/unified-product';

// Language config
const LANGUAGES = {
  de: { flag: '🇩🇪', name: 'Niemiecki', id: '1' },
  pl: { flag: '🇵🇱', name: 'Polski', id: '2' },
  en: { flag: '🇬🇧', name: 'Angielski', id: '3' },
} as const;

type LanguageCode = keyof typeof LANGUAGES;

// Slugify function
function slugify(text: string): string {
  const charMap: Record<string, string> = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'Ä': 'ae', 'Ö': 'oe', 'Ü': 'ue', 'ß': 'ss',
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n', 'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z',
  };
  let result = text.toString().toLowerCase();
  for (const [char, replacement] of Object.entries(charMap)) {
    result = result.replace(new RegExp(char, 'g'), replacement);
  }
  return result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 128);
}

// MTL Row Component
function MtlRow({
  icon,
  label,
  description,
  isEditing,
  value,
  editValue,
  onChange,
  multiline = false,
  large = false,
  readonly = false,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  isEditing: boolean;
  value: string;
  editValue: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  large?: boolean;
  readonly?: boolean;
  mono?: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="px-4 py-3 align-top">
        <div className="flex items-start gap-2">
          <span className="text-gray-400 mt-0.5">{icon}</span>
          <div>
            <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
              {label}
            </code>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {isEditing && !readonly ? (
          multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full ${large ? 'min-h-[200px]' : 'min-h-[80px]'} text-sm`}
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full text-sm"
            />
          )
        ) : (
          <div className={`text-sm ${mono ? 'font-mono text-blue-600' : 'text-gray-900'} ${large ? 'max-h-48 overflow-y-auto' : ''} whitespace-pre-wrap`}>
            {value || <span className="text-gray-400 italic">Brak</span>}
          </div>
        )}
      </td>
    </tr>
  );
}

// Props interface
interface MtlProductTableProps {
  product: UnifiedProduct;
  editedProduct: Partial<UnifiedProduct> | null;
  isEditing: boolean;
  language: LanguageCode;
  onFieldChange: (field: string, value: string) => void;
}

export function MtlProductTable({
  product,
  editedProduct,
  isEditing,
  language,
  onFieldChange,
}: MtlProductTableProps) {
  const langConfig = LANGUAGES[language] || LANGUAGES.de;

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 w-48">
              Pole
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-lg">{langConfig.flag}</span>
                Wartość ({langConfig.name})
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {/* Name */}
          <MtlRow
            icon={<Type className="w-4 h-4" />}
            label="name"
            description="Nazwa produktu"
            isEditing={isEditing}
            value={product.name}
            editValue={editedProduct?.name || ''}
            onChange={(v) => onFieldChange('name', v)}
          />

          {/* Description Short */}
          <MtlRow
            icon={<AlignLeft className="w-4 h-4" />}
            label="description_short"
            description="Krótki opis"
            isEditing={isEditing}
            value={product.description.short}
            editValue={editedProduct?.description?.short || ''}
            onChange={(v) => onFieldChange('description.short', v)}
            multiline
          />

          {/* Description Long */}
          <MtlRow
            icon={<FileText className="w-4 h-4" />}
            label="description"
            description="Długi opis HTML"
            isEditing={isEditing}
            value={product.description.long}
            editValue={editedProduct?.description?.long || ''}
            onChange={(v) => onFieldChange('description.long', v)}
            multiline
            large
          />

          {/* Link Rewrite (Slug) */}
          <MtlRow
            icon={<Link2 className="w-4 h-4" />}
            label="link_rewrite"
            description="URL przyjazny"
            isEditing={isEditing}
            value={slugify(product.name)}
            editValue={slugify(editedProduct?.name || '')}
            onChange={() => {}}
            readonly
            mono
          />

          {/* Meta Title */}
          <MtlRow
            icon={<Tag className="w-4 h-4" />}
            label="meta_title"
            description="Tytuł SEO"
            isEditing={isEditing}
            value={product.seo.title}
            editValue={editedProduct?.seo?.title || ''}
            onChange={(v) => onFieldChange('seo.title', v)}
          />

          {/* Meta Description */}
          <MtlRow
            icon={<AlignLeft className="w-4 h-4" />}
            label="meta_description"
            description="Opis SEO"
            isEditing={isEditing}
            value={product.seo.description}
            editValue={editedProduct?.seo?.description || ''}
            onChange={(v) => onFieldChange('seo.description', v)}
            multiline
          />

          {/* Tags/Keywords */}
          <MtlRow
            icon={<Hash className="w-4 h-4" />}
            label="tags"
            description="Słowa kluczowe"
            isEditing={isEditing}
            value={(product.seo.keywords || []).join(', ')}
            editValue={(editedProduct?.seo?.keywords || []).join(', ')}
            onChange={(v) => onFieldChange('seo.keywords', v)}
          />
        </tbody>
      </table>
    </div>
  );
}

export { LANGUAGES, slugify };
export type { LanguageCode };
