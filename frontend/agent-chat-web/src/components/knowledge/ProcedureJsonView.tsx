/**
 * JSON view with syntax highlighting for procedure content
 */

interface ProcedureJsonViewProps {
  content: unknown;
}

// Simple syntax highlighting for JSON
function highlightJson(json: string): string {
  return json
    // Strings (but not property names)
    .replace(/"([^"]+)"(?=\s*[,\]\}])/g, '<span class="text-green-400">"$1"</span>')
    // Property names
    .replace(/"([^"]+)"(?=\s*:)/g, '<span class="text-purple-400">"$1"</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-amber-400">$1</span>')
    // Booleans and null
    .replace(/\b(true|false|null)\b/g, '<span class="text-blue-400">$1</span>')
    // Braces and brackets
    .replace(/([{}\[\]])/g, '<span class="text-gray-500">$1</span>');
}

export function ProcedureJsonView({ content }: ProcedureJsonViewProps) {
  const jsonString = JSON.stringify(content, null, 2);
  const highlightedJson = highlightJson(jsonString);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(jsonString)}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title="Copy to clipboard"
        >
          Copy
        </button>
      </div>
      <pre 
        className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm max-h-[600px] font-mono leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedJson }}
      />
    </div>
  );
}
