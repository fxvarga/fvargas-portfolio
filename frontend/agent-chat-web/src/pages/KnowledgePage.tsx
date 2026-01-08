import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '@/api/client';
import type {
  KnowledgeItemSummaryDto,
  KnowledgeMetadataDto,
  KnowledgeItemType,
} from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  FileText,
  Scale,
  Layout,
  ChevronLeft,
  Loader2,
  Search,
  X,
} from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  Procedure: <BookOpen className="w-5 h-5" />,
  Policy: <FileText className="w-5 h-5" />,
  Standard: <Scale className="w-5 h-5" />,
  Template: <Layout className="w-5 h-5" />,
};

const typeColors: Record<string, string> = {
  Procedure: 'text-blue-400 bg-blue-400/10',
  Policy: 'text-green-400 bg-green-400/10',
  Standard: 'text-purple-400 bg-purple-400/10',
  Template: 'text-orange-400 bg-orange-400/10',
};

const typeBadgeVariants: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  Procedure: 'info',
  Policy: 'success',
  Standard: 'warning',
  Template: 'danger',
};

export function KnowledgePage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<KnowledgeItemSummaryDto[]>([]);
  const [metadata, setMetadata] = useState<KnowledgeMetadataDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<KnowledgeItemType | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Pagination
  const [skip, setSkip] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const take = 20;

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadItems();
  }, [selectedType, selectedCategory, keyword, skip]);

  const loadMetadata = async () => {
    try {
      const data = await api.getKnowledgeMetadata();
      setMetadata(data);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listKnowledgeItems({
        type: selectedType,
        category: selectedCategory,
        keyword: keyword || undefined,
        skip,
        take,
      });
      setItems(response.items);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0);
    setKeyword(searchInput);
  };

  const clearFilters = () => {
    setSelectedType(undefined);
    setSelectedCategory(undefined);
    setKeyword('');
    setSearchInput('');
    setSkip(0);
  };

  const handleItemClick = (item: KnowledgeItemSummaryDto) => {
    navigate(`/knowledge/${item.type}/${item.id}`);
  };

  const hasActiveFilters = selectedType || selectedCategory || keyword;
  const totalPages = Math.ceil(totalCount / take);
  const currentPage = Math.floor(skip / take) + 1;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-100">Knowledge Base</h1>
                  <p className="text-sm text-gray-400">
                    Procedures, Policies, Standards, and Templates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="w-64 flex-shrink-0">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-200">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Type Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Type</h4>
                  <div className="space-y-1">
                    {(['Procedure', 'Policy', 'Standard', 'Template'] as KnowledgeItemType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(selectedType === type ? undefined : type);
                          setSkip(0);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                          selectedType === type
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span className={typeColors[type]}>{typeIcons[type]}</span>
                        <span>{type}</span>
                        {metadata?.typeCounts[type] !== undefined && (
                          <span className="ml-auto text-xs text-gray-500">
                            {metadata.typeCounts[type]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                {metadata && metadata.categories.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Category</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {metadata.categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(selectedCategory === cat ? undefined : cat);
                            setSkip(0);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors capitalize ${
                            selectedCategory === cat
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search knowledge items..."
                  className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setKeyword('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {totalCount} item{totalCount !== 1 ? 's' : ''} found
                {hasActiveFilters && (
                  <span className="ml-2">
                    (filtered)
                  </span>
                )}
              </p>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-8 text-center text-red-400">
                  {error}
                </CardContent>
              </Card>
            ) : items.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No items found</p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      Clear filters
                    </button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {items.map((item) => (
                    <Card
                      key={`${item.type}-${item.id}`}
                      className="cursor-pointer hover:border-gray-600 transition-colors"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${typeColors[item.type]}`}>
                            {typeIcons[item.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-200 truncate">
                                {item.name}
                              </h3>
                              <Badge variant={typeBadgeVariants[item.type]}>
                                {item.type}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.category && (
                                <span className="text-xs text-gray-500 capitalize">
                                  {item.category}
                                </span>
                              )}
                              {item.subcategory && (
                                <>
                                  <span className="text-gray-600">/</span>
                                  <span className="text-xs text-gray-500 capitalize">
                                    {item.subcategory}
                                  </span>
                                </>
                              )}
                              {item.tags.length > 0 && (
                                <div className="flex gap-1 ml-2">
                                  {item.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="default">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {item.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{item.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={skip === 0}
                      onClick={() => setSkip(Math.max(0, skip - take))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={skip + take >= totalCount}
                      onClick={() => setSkip(skip + take)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
