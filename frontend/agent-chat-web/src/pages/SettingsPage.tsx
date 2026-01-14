import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '@/api/client';
import type { ToolSummaryDto, ToolDetailDto, ToolCategoryDto, ToolTestResult } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Settings,
  Wrench,
  ChevronLeft,
  Loader2,
  Search,
  X,
  ExternalLink,
  Code2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  ChevronRight,
  Copy,
  Check,
  Play,
  AlertCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';

const riskTierColors: Record<string, string> = {
  Low: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  High: 'text-orange-400 bg-orange-400/10',
  Critical: 'text-red-400 bg-red-400/10',
};

const riskTierBadgeVariants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
  Critical: 'danger',
};

const riskTierIcons: Record<string, React.ReactNode> = {
  Low: <ShieldCheck className="w-4 h-4" />,
  Medium: <Shield className="w-4 h-4" />,
  High: <ShieldAlert className="w-4 h-4" />,
  Critical: <ShieldOff className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  datalake: 'text-blue-400 bg-blue-400/10',
  finance_sor: 'text-purple-400 bg-purple-400/10',
  knowledge_base: 'text-green-400 bg-green-400/10',
  excel: 'text-emerald-400 bg-emerald-400/10',
  portfolio: 'text-cyan-400 bg-cyan-400/10',
  memory: 'text-pink-400 bg-pink-400/10',
  analysis: 'text-indigo-400 bg-indigo-400/10',
  content: 'text-amber-400 bg-amber-400/10',
  search: 'text-teal-400 bg-teal-400/10',
  filesystem: 'text-gray-400 bg-gray-400/10',
  code: 'text-red-400 bg-red-400/10',
};

export function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tools, setTools] = useState<ToolSummaryDto[]>([]);
  const [categories, setCategories] = useState<ToolCategoryDto[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get('category') || undefined
  );
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Tool testing state
  const [testArgs, setTestArgs] = useState<Record<string, string>>({});
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<ToolTestResult | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  useEffect(() => {
    loadCategories();
    loadTools();
  }, []);

  useEffect(() => {
    loadTools();
  }, [selectedCategory]);

  // Check URL for tool param on load
  useEffect(() => {
    const toolName = searchParams.get('tool');
    if (toolName && !selectedTool) {
      loadToolDetail(toolName);
    }
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const data = await api.getToolCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadTools = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listTools(selectedCategory);
      setTools(response.tools);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setIsLoading(false);
    }
  };

  const loadToolDetail = async (toolName: string) => {
    setIsLoadingDetail(true);
    setTestResult(null);
    setTestArgs({});
    setShowTestPanel(false);
    try {
      const detail = await api.getTool(toolName);
      setSelectedTool(detail);
      // Update URL
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tool', toolName);
      setSearchParams(newParams);
    } catch (err) {
      console.error('Failed to load tool detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleToolClick = (tool: ToolSummaryDto) => {
    loadToolDetail(tool.name);
  };

  const closeDetail = () => {
    setSelectedTool(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tool');
    setSearchParams(newParams);
  };

  const handleCategoryClick = (category: string) => {
    const newCategory = selectedCategory === category ? undefined : category;
    setSelectedCategory(newCategory);
    const newParams = new URLSearchParams(searchParams);
    if (newCategory) {
      newParams.set('category', newCategory);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const copySchema = async () => {
    if (selectedTool?.parametersSchemaRaw) {
      await navigator.clipboard.writeText(selectedTool.parametersSchemaRaw);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  const runTest = async () => {
    if (!selectedTool) return;
    
    setIsTestRunning(true);
    setTestResult(null);
    
    try {
      // Convert string values to appropriate types based on parameter schema
      const typedArgs: Record<string, unknown> = {};
      for (const param of selectedTool.parameters) {
        const value = testArgs[param.name];
        if (value === undefined || value === '') continue;
        
        // Type conversion based on parameter type
        if (param.type === 'number' || param.type === 'integer') {
          typedArgs[param.name] = Number(value);
        } else if (param.type === 'boolean') {
          typedArgs[param.name] = value === 'true';
        } else if (param.type === 'array') {
          try {
            typedArgs[param.name] = JSON.parse(value);
          } catch {
            typedArgs[param.name] = value.split(',').map(s => s.trim());
          }
        } else if (param.type === 'object') {
          try {
            typedArgs[param.name] = JSON.parse(value);
          } catch {
            typedArgs[param.name] = value;
          }
        } else {
          typedArgs[param.name] = value;
        }
      }
      
      const result = await api.testTool(selectedTool.name, typedArgs);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
        durationMs: 0,
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  const filteredTools = searchInput
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(searchInput.toLowerCase()) ||
          t.description.toLowerCase().includes(searchInput.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchInput.toLowerCase()))
      )
    : tools;

  const totalToolCount = categories.reduce((sum, c) => sum + c.count, 0);

  const exportMarkdown = async () => {
    try {
      const response = await fetch('/api/tools/export/markdown', {
        headers: {
          'X-Tenant-Id': '11111111-1111-1111-1111-111111111111',
        },
      });
      const markdown = await response.text();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent-chat-tools.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export markdown:', err);
    }
  };

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
                <Settings className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
                  <p className="text-sm text-gray-400">
                    Agent configuration and tool explorer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tool Explorer Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-100">Tool Explorer</h2>
            <span className="text-sm text-gray-500">({totalToolCount} tools)</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportMarkdown}
              className="ml-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Docs
            </Button>
          </div>

          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <aside className="w-64 flex-shrink-0">
              <Card>
                <CardContent className="py-4">
                  <h3 className="font-semibold text-gray-200 mb-4">Categories</h3>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                          selectedCategory === cat.name
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span className="capitalize">{cat.name.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{cat.count}</span>
                          {cat.riskBreakdown.High > 0 || cat.riskBreakdown.Critical > 0 ? (
                            <ShieldAlert className="w-3 h-3 text-orange-400" />
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedCategory && (
                    <button
                      onClick={() => handleCategoryClick(selectedCategory)}
                      className="mt-4 text-xs text-blue-400 hover:text-blue-300"
                    >
                      Clear filter
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Risk Legend */}
              <Card className="mt-4">
                <CardContent className="py-4">
                  <h3 className="font-semibold text-gray-200 mb-3">Risk Tiers</h3>
                  <div className="space-y-2 text-sm">
                    {['Low', 'Medium', 'High', 'Critical'].map((tier) => (
                      <div key={tier} className="flex items-center gap-2">
                        <span className={riskTierColors[tier]}>{riskTierIcons[tier]}</span>
                        <span className="text-gray-400">{tier}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search tools by name, description, or tags..."
                    className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="py-8 text-center text-red-400">{error}</CardContent>
                </Card>
              ) : filteredTools.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Wrench className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No tools found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredTools.map((tool) => (
                    <Card
                      key={tool.name}
                      className="cursor-pointer hover:border-gray-600 transition-colors"
                      onClick={() => handleToolClick(tool)}
                    >
                      <CardContent className="py-3">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${riskTierColors[tool.riskTier]}`}>
                            {riskTierIcons[tool.riskTier]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="font-mono text-sm text-blue-300">{tool.name}</code>
                              <Badge variant={riskTierBadgeVariants[tool.riskTier]}>
                                {tool.riskTier}
                              </Badge>
                              <span
                                className={`text-xs px-2 py-0.5 rounded capitalize ${
                                  categoryColors[tool.category] || 'text-gray-400 bg-gray-400/10'
                                }`}
                              >
                                {tool.category.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-1">{tool.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </main>

            {/* Detail Panel */}
            {selectedTool && (
              <aside className="w-96 flex-shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-gray-200">Tool Details</h3>
                    </div>
                    <button
                      onClick={closeDetail}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingDetail ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Tool Name & Meta */}
                        <div>
                          <code className="font-mono text-lg text-blue-300 block mb-2">
                            {selectedTool.name}
                          </code>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={riskTierBadgeVariants[selectedTool.riskTier]}>
                              {selectedTool.riskTier} Risk
                            </Badge>
                            <span
                              className={`text-xs px-2 py-0.5 rounded capitalize ${
                                categoryColors[selectedTool.category] || 'text-gray-400 bg-gray-400/10'
                              }`}
                            >
                              {selectedTool.category.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                          <p className="text-sm text-gray-300">{selectedTool.description}</p>
                        </div>

                        {/* Parameters */}
                        {selectedTool.parameters.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">
                              Parameters ({selectedTool.parameters.length})
                            </h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {selectedTool.parameters.map((param) => (
                                <div
                                  key={param.name}
                                  className="bg-gray-800 rounded p-2 text-sm"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-cyan-300">{param.name}</code>
                                    <span className="text-xs text-gray-500">{param.type}</span>
                                    {param.required && (
                                      <span className="text-xs text-red-400">required</span>
                                    )}
                                  </div>
                                  {param.description && (
                                    <p className="text-xs text-gray-400">{param.description}</p>
                                  )}
                                  {param.enumValues && param.enumValues.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {param.enumValues.map((val) => (
                                        <span
                                          key={val}
                                          className="text-xs px-1.5 py-0.5 bg-gray-700 rounded text-gray-300"
                                        >
                                          {val}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {param.defaultValue && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Default: <code>{param.defaultValue}</code>
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {selectedTool.tags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedTool.tags.map((tag) => (
                                <Badge key={tag} variant="default">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Schema JSON */}
                        {selectedTool.parametersSchemaRaw && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-400">JSON Schema</h4>
                              <button
                                onClick={copySchema}
                                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                              >
                                {copiedSchema ? (
                                  <>
                                    <Check className="w-3 h-3" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="bg-gray-800 rounded p-2 text-xs text-gray-300 overflow-x-auto max-h-40">
                              {JSON.stringify(JSON.parse(selectedTool.parametersSchemaRaw), null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Source Code Link */}
                        {selectedTool.gitHubUrl && (
                          <div className="pt-2 border-t border-gray-700">
                            <a
                              href={selectedTool.gitHubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                            >
                              <Code2 className="w-4 h-4" />
                              View Source Code
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {selectedTool.sourceFile && (
                              <p className="text-xs text-gray-500 mt-1 font-mono">
                                {selectedTool.sourceFile}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Tool Testing Section */}
                        <div className="pt-2 border-t border-gray-700">
                          <button
                            onClick={() => setShowTestPanel(!showTestPanel)}
                            className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 w-full"
                          >
                            <Play className="w-4 h-4" />
                            {showTestPanel ? 'Hide Test Panel' : 'Test Tool'}
                            <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showTestPanel ? 'rotate-90' : ''}`} />
                          </button>
                          
                          {showTestPanel && (
                            <div className="mt-3 space-y-3">
                              {/* Parameter inputs */}
                              {selectedTool.parameters.length > 0 ? (
                                <div className="space-y-2">
                                  {selectedTool.parameters.map((param) => (
                                    <div key={param.name}>
                                      <label className="block text-xs text-gray-400 mb-1">
                                        {param.name}
                                        {param.required && <span className="text-red-400 ml-1">*</span>}
                                      </label>
                                      {param.enumValues && param.enumValues.length > 0 ? (
                                        <select
                                          value={testArgs[param.name] || ''}
                                          onChange={(e) => setTestArgs({ ...testArgs, [param.name]: e.target.value })}
                                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-green-500"
                                        >
                                          <option value="">Select...</option>
                                          {param.enumValues.map((val) => (
                                            <option key={val} value={val}>{val}</option>
                                          ))}
                                        </select>
                                      ) : param.type === 'boolean' ? (
                                        <select
                                          value={testArgs[param.name] || ''}
                                          onChange={(e) => setTestArgs({ ...testArgs, [param.name]: e.target.value })}
                                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-green-500"
                                        >
                                          <option value="">Select...</option>
                                          <option value="true">true</option>
                                          <option value="false">false</option>
                                        </select>
                                      ) : (
                                        <input
                                          type={param.type === 'number' || param.type === 'integer' ? 'number' : 'text'}
                                          value={testArgs[param.name] || ''}
                                          onChange={(e) => setTestArgs({ ...testArgs, [param.name]: e.target.value })}
                                          placeholder={param.defaultValue || param.description || param.name}
                                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">No parameters required</p>
                              )}
                              
                              {/* Run button */}
                              <Button
                                onClick={runTest}
                                disabled={isTestRunning}
                                className="w-full"
                                variant="primary"
                              >
                                {isTestRunning ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Running...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Run Test
                                  </>
                                )}
                              </Button>
                              
                              {/* Test result */}
                              {testResult && (
                                <div className={`rounded p-3 ${testResult.success ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    {testResult.success ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-red-400" />
                                    )}
                                    <span className={`text-sm font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                      {testResult.success ? 'Success' : 'Failed'}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-auto">
                                      {testResult.durationMs.toFixed(1)}ms
                                    </span>
                                  </div>
                                  {testResult.error && (
                                    <p className="text-xs text-red-300 mb-2">{testResult.error}</p>
                                  )}
                                  {testResult.result !== undefined && testResult.result !== null && (
                                    <pre className="text-xs text-gray-300 overflow-x-auto max-h-40 bg-gray-800 rounded p-2">
                                      {typeof testResult.result === 'string' 
                                        ? testResult.result 
                                        : JSON.stringify(testResult.result, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
