/**
 * Standard content viewer with section hierarchy tree
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { StandardContent, StandardSection } from '@/types/knowledge';
import { 
  Scale, 
  Building, 
  Calendar,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ListChecks,
  FileText,
  Lightbulb
} from 'lucide-react';

interface StandardContentViewerProps {
  content: StandardContent;
}

interface SectionTreeItemProps {
  section: StandardSection;
  depth?: number;
}

function SectionTreeItem({ section, depth = 0 }: SectionTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = section.subsections && section.subsections.length > 0;
  const hasContent = section.content || section.key_points?.length || section.examples?.length;

  return (
    <div className={`${depth > 0 ? 'ml-4 border-l border-gray-700 pl-4' : ''}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors
          ${hasChildren || hasContent ? 'hover:bg-gray-800/50 cursor-pointer' : 'cursor-default'}
        `}
      >
        {(hasChildren || hasContent) ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          )
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              {section.id}
            </span>
            <span className="font-medium text-gray-200 truncate">{section.title}</span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-2">
          {/* Section Content */}
          {section.content && (
            <p className="text-sm text-gray-400 leading-relaxed p-2 bg-gray-800/30 rounded">
              {section.content}
            </p>
          )}

          {/* Key Points */}
          {section.key_points && section.key_points.length > 0 && (
            <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mb-2">
                <Lightbulb className="w-3 h-3" />
                Key Points
              </div>
              <ul className="space-y-1">
                {section.key_points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Examples */}
          {section.examples && section.examples.length > 0 && (
            <div className="p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 mb-2">
                <FileText className="w-3 h-3" />
                Examples
              </div>
              <ul className="space-y-1">
                {section.examples.map((example, idx) => (
                  <li key={idx} className="text-sm text-gray-300 italic">
                    "{example}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Subsections */}
          {section.subsections && section.subsections.map((sub, idx) => (
            <SectionTreeItem key={idx} section={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StandardContentViewer({ content }: StandardContentViewerProps) {
  return (
    <div className="space-y-6">
      {/* Standard Overview */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Scale className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-mono font-medium text-gray-100">
                  {content.codification}
                </p>
                <p className="text-xs text-gray-500">Codification</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100">
                  {content.issuer || 'FASB'}
                </p>
                <p className="text-xs text-gray-500">Issuer</p>
              </div>
            </div>
            {content.effective_date && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">
                    {content.effective_date}
                  </p>
                  <p className="text-xs text-gray-500">Effective Date</p>
                </div>
              </div>
            )}
            {content.version && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">v{content.version}</p>
                  <p className="text-xs text-gray-500">Version</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scope */}
      {content.scope && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Scope</h3>
            <p className="text-gray-300 leading-relaxed">{content.scope}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Principles */}
      {content.key_principles && content.key_principles.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-300">Key Principles</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {content.key_principles.map((principle, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-300">{principle}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recognition Criteria */}
      {content.recognition_criteria && content.recognition_criteria.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-semibold text-gray-300">Recognition Criteria</h3>
            </div>
            <ul className="space-y-2">
              {content.recognition_criteria.map((criteria, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{criteria}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Section Hierarchy */}
      {content.sections && content.sections.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-300">Sections</h3>
            </div>
            <div className="space-y-1">
              {content.sections.map((section, idx) => (
                <SectionTreeItem key={idx} section={section} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Standards */}
      {content.related_standards && content.related_standards.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Related Standards</h3>
            <div className="flex flex-wrap gap-2">
              {content.related_standards.map(std => (
                <Badge key={std.id} variant="info">
                  {std.id}: {std.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclosure Requirements */}
      {content.disclosure_requirements && content.disclosure_requirements.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Disclosure Requirements</h3>
            <ul className="space-y-2">
              {content.disclosure_requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300 p-2 bg-gray-800/50 rounded">
                  <span className="text-purple-400 font-bold">{idx + 1}.</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON */}
      <Card>
        <CardContent className="py-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Full Standard Content</h3>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm text-gray-300 max-h-[400px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
