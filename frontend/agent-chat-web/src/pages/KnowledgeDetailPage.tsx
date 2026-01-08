import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '@/api/client';
import type { KnowledgeItemDto, KnowledgeItemType } from '@/types';
import {
  isProcedureContent,
  isPolicyContent,
  isStandardContent,
  isTemplateContent,
  normalizeProcedureContent,
  type PolicyContent,
  type StandardContent,
  type TemplateContent,
} from '@/types/knowledge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ProcedureContentViewer,
  PolicyContentViewer,
  StandardContentViewer,
  TemplateContentViewer,
} from '@/components/knowledge';
import {
  BookOpen,
  FileText,
  Scale,
  Layout,
  ChevronLeft,
  Loader2,
  Calendar,
  User,
  Hash,
  ListOrdered,
} from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  Procedure: <BookOpen className="w-6 h-6" />,
  Policy: <FileText className="w-6 h-6" />,
  Standard: <Scale className="w-6 h-6" />,
  Template: <Layout className="w-6 h-6" />,
};

const typeColors: Record<string, string> = {
  Procedure: 'text-blue-400 bg-blue-400/10',
  Policy: 'text-green-400 bg-green-400/10',
  Standard: 'text-purple-400 bg-purple-400/10',
  Template: 'text-orange-400 bg-orange-400/10',
};

export function KnowledgeDetailPage() {
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: KnowledgeItemType; id: string }>();

  const [item, setItem] = useState<KnowledgeItemDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type && id) {
      loadItem();
    }
  }, [type, id]);

  const loadItem = async () => {
    if (!type || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getKnowledgeItem(type, id);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-900">
        <header className="border-b border-gray-700 bg-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Button variant="ghost" onClick={() => navigate('/knowledge')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Knowledge Base
            </Button>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center text-red-400">
              {error || 'Item not found'}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Render type-specific content viewer
  const renderContentViewer = () => {
    const content = item.content;
    
    if (!content) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No content available
          </CardContent>
        </Card>
      );
    }

    // Check content type and render appropriate viewer
    // For Procedures, normalize the PascalCase API response to snake_case
    if (item.type === 'Procedure' && isProcedureContent(content)) {
      const normalizedContent = normalizeProcedureContent(content);
      if (normalizedContent) {
        return <ProcedureContentViewer content={normalizedContent} />;
      }
    }
    
    if (item.type === 'Policy' && isPolicyContent(content)) {
      return <PolicyContentViewer content={content as PolicyContent} />;
    }
    
    if (item.type === 'Standard' && isStandardContent(content)) {
      return <StandardContentViewer content={content as StandardContent} />;
    }
    
    if (item.type === 'Template' && isTemplateContent(content)) {
      return <TemplateContentViewer content={content as TemplateContent} />;
    }

    // Fallback to raw JSON for unrecognized content
    return (
      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Content</h3>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm text-gray-300 max-h-[600px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/knowledge')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className={`p-3 rounded-lg ${typeColors[item.type]}`}>
              {typeIcons[item.type]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-100">{item.name}</h1>
                <Badge variant="info">{item.type}</Badge>
              </div>
              {item.description && (
                <p className="text-gray-400">{item.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Metadata */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {item.version && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Version:</span>
                  <span className="text-gray-200">{item.version}</span>
                </div>
              )}
              {item.owner && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Owner:</span>
                  <span className="text-gray-200 capitalize">{item.owner.replace(/_/g, ' ')}</span>
                </div>
              )}
              {item.effectiveDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Effective:</span>
                  <span className="text-gray-200">{item.effectiveDate}</span>
                </div>
              )}
              {item.codification && (
                <div className="flex items-center gap-2 text-sm">
                  <Scale className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Codification:</span>
                  <span className="text-gray-200">{item.codification}</span>
                </div>
              )}
              {item.stepCount !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <ListOrdered className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Steps:</span>
                  <span className="text-gray-200">{item.stepCount}</span>
                </div>
              )}
              {item.category && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Category:</span>
                  <span className="text-gray-200 capitalize">{item.category}</span>
                </div>
              )}
              {item.subcategory && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Subcategory:</span>
                  <span className="text-gray-200 capitalize">{item.subcategory}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {item.tags.length > 0 && (
          <Card className="mb-6">
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Type-specific Content Viewer */}
        {renderContentViewer()}
      </main>
    </div>
  );
}
