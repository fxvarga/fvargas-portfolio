// ============================================================
// CMS Agent Panel — Vanilla JS Implementation
// Replicates the React @fvargas/cms-agent-panel without any
// framework dependency. Designed for static HTML sites served
// by nginx (executive-catering, 1stopwings).
//
// Exposes window.CmsAgentPanel with an init() method.
// ============================================================

// --------------- GraphQL Operations ---------------

var AGENT_CHAT_MUTATION = '\
  mutation AgentChat($input: AgentChatInput!) {\
    agentChat(input: $input) {\
      message\
      sessionId\
      proposedChanges {\
        id entityType recordId fieldPath oldValue newValue description\
      }\
    }\
  }';

var AGENT_COMMIT_MUTATION = '\
  mutation AgentCommit($input: AgentCommitInput!) {\
    agentCommit(input: $input) {\
      success\
      results { changeId success error }\
      error\
    }\
  }';

var LOGIN_MUTATION = '\
  mutation Login($input: LoginInput!) {\
    login(input: $input) {\
      success\
      token\
      user { id username role }\
      portfolios { id slug name }\
      errorMessage\
    }\
  }';

// --------------- State ---------------

var state = {
  isOpen: false,
  messages: [],          // { id, role, content, timestamp, proposedChanges? }
  proposedChanges: [],   // { id, entityType, recordId, fieldPath, oldValue, newValue, description }
  sessionId: null,
  isLoading: false,
  error: null,
  isInspecting: false,
  selectedSection: null, // { selector, entityType, label }
  isPreviewActive: true,
  toolbarExpanded: false
};

var config = {
  graphqlUrl: '/graphql',
  wsUrl: null,
  token: null,
  portfolioId: null,
  sections: [],
  onPreviewChange: null,  // callback(proposedChanges) — for host to apply preview
  onCommitted: null,      // callback() — for host to refetch content
  onDiscard: null          // callback() — for host to restore original content
};

var els = {}; // DOM element references

// --------------- Utilities ---------------

function uid(prefix) {
  return (prefix || 'cap') + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

function esc(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --------------- GraphQL Client ---------------

function buildHeaders() {
  var headers = { 'Content-Type': 'application/json' };
  if (config.token) headers['Authorization'] = 'Bearer ' + config.token;
  if (config.portfolioId) headers['X-Portfolio-ID'] = config.portfolioId;
  return headers;
}

function gqlFetch(query, variables) {
  return fetch(config.graphqlUrl, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ query: query, variables: variables || {} })
  })
    .then(function(res) {
      if (!res.ok) throw new Error('GraphQL request failed: ' + res.status);
      return res.json();
    })
    .then(function(json) {
      if (json.errors && json.errors.length) {
        throw new Error(json.errors.map(function(e) { return e.message; }).join('; '));
      }
      return json.data;
    });
}

function sendAgentMessage(message, history, sessionId, focusedSection, currentRoute) {
  var conversationHistory = history
    .filter(function(m) { return m.role === 'user' || m.role === 'assistant'; })
    .map(function(m) { return { role: m.role, content: m.content }; });

  var input = { message: message, conversationHistory: conversationHistory, sessionId: sessionId };
  if (focusedSection) input.focusedSection = focusedSection;
  if (currentRoute) input.currentRoute = currentRoute;

  return gqlFetch(AGENT_CHAT_MUTATION, {
    input: input
  }).then(function(data) {
    return data.agentChat;
  });
}

function commitChanges(changes) {
  return gqlFetch(AGENT_COMMIT_MUTATION, {
    input: {
      changes: changes.map(function(c) {
        return {
          id: c.id, entityType: c.entityType, recordId: c.recordId,
          fieldPath: c.fieldPath, oldValue: c.oldValue, newValue: c.newValue,
          description: c.description
        };
      })
    }
  }).then(function(data) {
    return data.agentCommit;
  });
}

function loginAgent(username, password) {
  return fetch(config.graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: LOGIN_MUTATION,
      variables: { input: { username: username, password: password } }
    })
  })
    .then(function(res) {
      if (!res.ok) throw new Error('Login request failed: ' + res.status);
      return res.json();
    })
    .then(function(json) {
      if (json.errors && json.errors.length) {
        throw new Error(json.errors.map(function(e) { return e.message; }).join('; '));
      }
      return json.data.login;
    });
}

// --------------- Markdown Renderer ---------------

function parseInlineMarkdown(text) {
  // Order: inline code, bold+italic, bold, italic, links
  return text
    .replace(/`([^`]+)`/g, '<code class="cap-md-code">$1</code>')
    .replace(/\*{3}([^*]+?)\*{3}/g, '<strong class="cap-md-bold"><em class="cap-md-italic">$1</em></strong>')
    .replace(/\*{2}([^*]+?)\*{2}/g, '<strong class="cap-md-bold">$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em class="cap-md-italic">$1</em>')
    .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a class="cap-md-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderMarkdown(content) {
  var lines = content.split('\n');
  var html = [];
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      var lang = line.trimStart().slice(3).trim();
      var codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(esc(lines[i]));
        i++;
      }
      i++; // skip closing ```
      var langClass = lang ? ' cap-md-lang-' + esc(lang) : '';
      html.push('<pre class="cap-md-pre"><code class="cap-md-codeblock' + langClass + '">' + codeLines.join('\n') + '</code></pre>');
      continue;
    }

    // Heading
    var headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      var level = headingMatch[1].length;
      html.push('<h' + level + ' class="cap-md-heading cap-md-h' + level + '">' + parseInlineMarkdown(esc(headingMatch[2])) + '</h' + level + '>');
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      html.push('<hr class="cap-md-hr">');
      i++;
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s+/.test(line)) {
      var items = [];
      while (i < lines.length && /^[\s]*[-*+]\s+/.test(lines[i])) {
        var itemText = lines[i].replace(/^[\s]*[-*+]\s+/, '');
        items.push('<li>' + parseInlineMarkdown(esc(itemText)) + '</li>');
        i++;
      }
      html.push('<ul class="cap-md-ul">' + items.join('') + '</ul>');
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+[.)]\s+/.test(line)) {
      var items = [];
      while (i < lines.length && /^[\s]*\d+[.)]\s+/.test(lines[i])) {
        var itemText = lines[i].replace(/^[\s]*\d+[.)]\s+/, '');
        items.push('<li>' + parseInlineMarkdown(esc(itemText)) + '</li>');
        i++;
      }
      html.push('<ol class="cap-md-ol">' + items.join('') + '</ol>');
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    var paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('```') &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^[\s]*[-*+]\s+/.test(lines[i]) &&
      !/^[\s]*\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html.push('<p class="cap-md-p">' + parseInlineMarkdown(esc(paraLines.join('\n'))) + '</p>');
    }
  }

  return '<div class="cap-md">' + html.join('') + '</div>';
}

// --------------- DOM Construction ---------------

function buildPanel() {
  // FAB toggle button
  els.toggle = document.createElement('button');
  els.toggle.className = 'cap-toggle';
  els.toggle.setAttribute('aria-label', 'Open CMS Agent');
  els.toggle.setAttribute('title', 'Open CMS Agent');
  els.toggle.innerHTML =
    '<svg class="cap-toggle__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
    '</svg>';
  els.toggle.addEventListener('click', togglePanel);

  // Badge (for pending changes count)
  els.badge = document.createElement('span');
  els.badge.className = 'cap-toggle__badge';
  els.badge.style.display = 'none';
  els.toggle.appendChild(els.badge);

  // Backdrop
  els.backdrop = document.createElement('div');
  els.backdrop.className = 'cap-backdrop';
  els.backdrop.style.display = 'none';
  els.backdrop.addEventListener('click', closePanel);

  // Panel
  els.panel = document.createElement('div');
  els.panel.className = 'cap-panel';

  // Header
  var header = document.createElement('div');
  header.className = 'cap-panel__header';
  var title = document.createElement('h3');
  title.className = 'cap-panel__title';
  title.textContent = 'CMS Agent';
  header.appendChild(title);

  var headerActions = document.createElement('div');
  headerActions.className = 'cap-panel__header-actions';

  // Inspect button (only if sections configured)
  if (config.sections && config.sections.length > 0) {
    els.inspectBtn = document.createElement('button');
    els.inspectBtn.className = 'cap-btn cap-btn--inspect';
    els.inspectBtn.setAttribute('title', 'Inspect section');
    els.inspectBtn.setAttribute('aria-label', 'Inspect section');
    els.inspectBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<line x1="12" y1="2" x2="12" y2="6"/>' +
      '<line x1="12" y1="18" x2="12" y2="22"/>' +
      '<line x1="2" y1="12" x2="6" y2="12"/>' +
      '<line x1="18" y1="12" x2="22" y2="12"/>' +
      '</svg>';
    els.inspectBtn.addEventListener('click', toggleInspect);
    headerActions.appendChild(els.inspectBtn);
  }

  // New conversation button
  var newBtn = document.createElement('button');
  newBtn.className = 'cap-btn cap-btn--icon';
  newBtn.setAttribute('title', 'New conversation');
  newBtn.setAttribute('aria-label', 'New conversation');
  newBtn.innerHTML = '&#x21bb;';
  newBtn.addEventListener('click', clearSession);
  headerActions.appendChild(newBtn);

  // Close button
  var closeBtn = document.createElement('button');
  closeBtn.className = 'cap-btn cap-btn--icon';
  closeBtn.setAttribute('title', 'Close panel');
  closeBtn.setAttribute('aria-label', 'Close panel');
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', closePanel);
  headerActions.appendChild(closeBtn);

  header.appendChild(headerActions);
  els.panel.appendChild(header);

  // Section badge (hidden by default)
  els.sectionBadge = document.createElement('div');
  els.sectionBadge.className = 'cap-section-badge';
  els.sectionBadge.style.display = 'none';
  els.panel.appendChild(els.sectionBadge);

  // Messages area
  els.messages = document.createElement('div');
  els.messages.className = 'cap-panel__messages';
  els.panel.appendChild(els.messages);

  // Commit toolbar (hidden by default)
  els.commitToolbar = document.createElement('div');
  els.commitToolbar.className = 'cap-commit-toolbar';
  els.commitToolbar.style.display = 'none';
  els.panel.appendChild(els.commitToolbar);

  // Input area
  els.inputArea = document.createElement('div');
  els.inputArea.className = 'cap-panel__input';
  els.input = document.createElement('textarea');
  els.input.className = 'cap-input';
  els.input.setAttribute('placeholder', 'Ask me to edit your content...');
  els.input.setAttribute('rows', '1');
  els.input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
  els.inputArea.appendChild(els.input);

  els.sendBtn = document.createElement('button');
  els.sendBtn.className = 'cap-btn cap-btn--send';
  els.sendBtn.setAttribute('aria-label', 'Send message');
  els.sendBtn.innerHTML = '&#x27A4;';
  els.sendBtn.addEventListener('click', handleSend);
  els.inputArea.appendChild(els.sendBtn);
  els.panel.appendChild(els.inputArea);

  // Preview banner (fixed at top, hidden by default)
  els.previewBanner = document.createElement('div');
  els.previewBanner.className = 'cap-preview-banner cap-preview-banner--active';
  els.previewBanner.style.display = 'none';
  els.previewBanner.innerHTML =
    '<div class="cap-preview-banner__content">' +
      '<div class="cap-preview-banner__status">' +
        '<span class="cap-preview-banner__dot"></span>' +
        '<span class="cap-preview-banner__text"></span>' +
      '</div>' +
      '<div class="cap-preview-banner__actions">' +
        '<button class="cap-preview-banner__btn cap-preview-banner__btn--toggle">Pause</button>' +
        '<button class="cap-preview-banner__btn cap-preview-banner__btn--discard">Discard</button>' +
        '<button class="cap-preview-banner__btn cap-preview-banner__btn--commit">Commit All</button>' +
      '</div>' +
    '</div>';

  // Inspector elements (created on demand)
  els.inspectorOverlay = null;
  els.inspectorHighlight = null;
  els.inspectorBar = null;

  // Mount to DOM
  document.body.appendChild(els.toggle);
  document.body.appendChild(els.backdrop);
  document.body.appendChild(els.panel);
  document.body.appendChild(els.previewBanner);

  // Wire preview banner buttons
  els.previewBanner.querySelector('.cap-preview-banner__btn--toggle').addEventListener('click', togglePreview);
  els.previewBanner.querySelector('.cap-preview-banner__btn--discard').addEventListener('click', function() { discardChanges(); });
  els.previewBanner.querySelector('.cap-preview-banner__btn--commit').addEventListener('click', function() { doCommit(); });
}

// --------------- Actions ---------------

function togglePanel() {
  state.isOpen = !state.isOpen;
  renderPanelState();
  if (state.isOpen) {
    setTimeout(function() { els.input.focus(); }, 300);
  }
}

function closePanel() {
  state.isOpen = false;
  renderPanelState();
}

function openPanel() {
  state.isOpen = true;
  renderPanelState();
  setTimeout(function() { els.input.focus(); }, 300);
}

function clearSession() {
  state.messages = [];
  state.proposedChanges = [];
  state.sessionId = null;
  state.isLoading = false;
  state.error = null;
  state.isInspecting = false;
  state.selectedSection = null;
  state.isPreviewActive = true;
  state.toolbarExpanded = false;
  teardownInspector();
  renderMessages();
  renderCommitToolbar();
  renderPreviewBanner();
  renderSectionBadge();
  if (config.onDiscard) config.onDiscard();
}

function toggleInspect() {
  state.isInspecting = !state.isInspecting;
  if (state.isInspecting) {
    setupInspector();
  } else {
    teardownInspector();
  }
  renderInspectButton();
}

function selectSection(section) {
  state.selectedSection = section;
  state.isInspecting = false;
  teardownInspector();
  renderSectionBadge();
  renderInspectButton();
  // Open panel when a section is selected
  if (section && !state.isOpen) {
    openPanel();
  }
}

function togglePreview() {
  state.isPreviewActive = !state.isPreviewActive;
  renderPreviewBanner();
  // Notify host
  if (state.isPreviewActive && state.proposedChanges.length > 0) {
    if (config.onPreviewChange) config.onPreviewChange(state.proposedChanges);
  } else if (!state.isPreviewActive) {
    if (config.onDiscard) config.onDiscard();
  }
}

function handleSend() {
  var text = els.input.value.trim();
  if (!text || state.isLoading || !config.token) return;

  els.input.value = '';

  var userMsg = {
    id: uid('user'),
    role: 'user',
    content: text,
    timestamp: new Date()
  };

  state.messages.push(userMsg);
  state.isLoading = true;
  state.error = null;
  renderMessages();
  renderInputState();

  // Send section context and page route as dedicated fields
  var focusedSection = state.selectedSection ? state.selectedSection.entityType : null;
  var currentRoute = window.location.pathname;

  sendAgentMessage(text, state.messages, state.sessionId, focusedSection, currentRoute)
    .then(function(response) {
      var assistantMsg = {
        id: uid('assistant'),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        proposedChanges: response.proposedChanges.length > 0 ? response.proposedChanges : undefined
      };

      state.messages.push(assistantMsg);
      state.sessionId = response.sessionId;
      state.isLoading = false;

      if (response.proposedChanges.length > 0) {
        state.proposedChanges = state.proposedChanges.concat(response.proposedChanges);
        if (config.onPreviewChange && state.isPreviewActive) {
          config.onPreviewChange(state.proposedChanges);
        }
      }

      renderMessages();
      renderInputState();
      renderCommitToolbar();
      renderPreviewBanner();
      renderBadge();
    })
    .catch(function(err) {
      state.error = err.message || 'Failed to send message';
      state.isLoading = false;
      renderMessages();
      renderInputState();
    });
}

function doCommit() {
  if (state.proposedChanges.length === 0 || state.isLoading) return;
  state.isLoading = true;
  renderCommitToolbar();
  renderPreviewBanner();
  renderInputState();

  commitChanges(state.proposedChanges)
    .then(function(result) {
      state.isLoading = false;
      if (result.success) {
        var count = result.results.filter(function(r) { return r.success; }).length;
        state.proposedChanges = [];

        state.messages.push({
          id: uid('system'),
          role: 'system',
          content: 'Committed ' + count + ' change' + (count !== 1 ? 's' : '') + ' successfully. The page content has been updated.',
          timestamp: new Date()
        });

        if (config.onCommitted) config.onCommitted();
      } else {
        var errorMsg = result.error || 'Commit failed';
        state.error = errorMsg;
        state.messages.push({
          id: uid('system-error'),
          role: 'system',
          content: 'Commit failed: ' + errorMsg,
          timestamp: new Date()
        });
      }

      renderMessages();
      renderCommitToolbar();
      renderPreviewBanner();
      renderBadge();
      renderInputState();
    })
    .catch(function(err) {
      state.isLoading = false;
      state.error = err.message || 'Failed to commit changes';
      state.messages.push({
        id: uid('system-error'),
        role: 'system',
        content: 'Commit failed: ' + (err.message || 'Unknown error'),
        timestamp: new Date()
      });
      renderMessages();
      renderCommitToolbar();
      renderPreviewBanner();
      renderInputState();
    });
}

function discardChanges() {
  var count = state.proposedChanges.length;
  if (count === 0) return;

  state.proposedChanges = [];

  state.messages.push({
    id: uid('system'),
    role: 'system',
    content: 'Discarded ' + count + ' pending change' + (count !== 1 ? 's' : '') + '. The page is showing the original content.',
    timestamp: new Date()
  });

  if (config.onDiscard) config.onDiscard();

  renderMessages();
  renderCommitToolbar();
  renderPreviewBanner();
  renderBadge();
}

// --------------- Section Inspector ---------------

var inspectorMouseMove = null;
var inspectorClick = null;
var inspectorKeyDown = null;
var inspectorMatchedSection = null;

function setupInspector() {
  // Overlay
  els.inspectorOverlay = document.createElement('div');
  els.inspectorOverlay.className = 'cap-inspector-overlay';
  document.body.appendChild(els.inspectorOverlay);

  // Highlight
  els.inspectorHighlight = document.createElement('div');
  els.inspectorHighlight.className = 'cap-inspector-highlight';
  els.inspectorHighlight.style.display = 'none';
  els.inspectorHighlight.innerHTML =
    '<div class="cap-inspector-label">' +
      '<span class="cap-inspector-label__entity"></span>' +
      '<span class="cap-inspector-label__name"></span>' +
    '</div>';
  document.body.appendChild(els.inspectorHighlight);

  // Instruction bar
  els.inspectorBar = document.createElement('div');
  els.inspectorBar.className = 'cap-inspector-bar';
  els.inspectorBar.innerHTML =
    '<span class="cap-inspector-bar__icon">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="12" r="10"/>' +
        '<line x1="12" y1="2" x2="12" y2="6"/>' +
        '<line x1="12" y1="18" x2="12" y2="22"/>' +
        '<line x1="2" y1="12" x2="6" y2="12"/>' +
        '<line x1="18" y1="12" x2="22" y2="12"/>' +
      '</svg>' +
    '</span>' +
    'Select a section to provide context &middot; Press <kbd>Esc</kbd> to cancel';
  document.body.appendChild(els.inspectorBar);

  // Hide backdrop during inspect
  els.backdrop.style.display = 'none';

  // Event handlers
  inspectorMouseMove = function(e) {
    var match = findSectionAt(e.clientX, e.clientY);
    inspectorMatchedSection = match;
    if (match) {
      var rect = match.el.getBoundingClientRect();
      els.inspectorHighlight.style.display = 'block';
      els.inspectorHighlight.style.top = rect.top + 'px';
      els.inspectorHighlight.style.left = rect.left + 'px';
      els.inspectorHighlight.style.width = rect.width + 'px';
      els.inspectorHighlight.style.height = rect.height + 'px';
      els.inspectorHighlight.querySelector('.cap-inspector-label__entity').textContent = match.descriptor.entityType;
      els.inspectorHighlight.querySelector('.cap-inspector-label__name').textContent = match.descriptor.label;
    } else {
      els.inspectorHighlight.style.display = 'none';
    }
  };

  inspectorClick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (inspectorMatchedSection) {
      selectSection(inspectorMatchedSection.descriptor);
    } else {
      selectSection(null);
    }
  };

  inspectorKeyDown = function(e) {
    if (e.key === 'Escape') {
      selectSection(null);
    }
  };

  document.addEventListener('mousemove', inspectorMouseMove, true);
  document.addEventListener('click', inspectorClick, true);
  document.addEventListener('keydown', inspectorKeyDown, true);
}

function teardownInspector() {
  if (inspectorMouseMove) {
    document.removeEventListener('mousemove', inspectorMouseMove, true);
    document.removeEventListener('click', inspectorClick, true);
    document.removeEventListener('keydown', inspectorKeyDown, true);
    inspectorMouseMove = null;
    inspectorClick = null;
    inspectorKeyDown = null;
    inspectorMatchedSection = null;
  }
  if (els.inspectorOverlay) {
    els.inspectorOverlay.remove();
    els.inspectorOverlay = null;
  }
  if (els.inspectorHighlight) {
    els.inspectorHighlight.remove();
    els.inspectorHighlight = null;
  }
  if (els.inspectorBar) {
    els.inspectorBar.remove();
    els.inspectorBar = null;
  }
}

function findSectionAt(x, y) {
  if (!config.sections || config.sections.length === 0) return null;
  var best = null;
  for (var i = 0; i < config.sections.length; i++) {
    var desc = config.sections[i];
    var nodeList = document.querySelectorAll(desc.selector);
    for (var j = 0; j < nodeList.length; j++) {
      var el = nodeList[j];
      var rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        var area = rect.width * rect.height;
        if (!best || area < best.area) {
          best = { el: el, descriptor: desc, area: area };
        }
      }
    }
  }
  return best ? { el: best.el, descriptor: best.descriptor } : null;
}

// --------------- Rendering ---------------

function renderPanelState() {
  if (state.isOpen) {
    els.panel.classList.add('cap-panel--open');
    els.toggle.classList.add('cap-toggle--active');
    els.toggle.setAttribute('aria-label', 'Close CMS Agent');
    els.toggle.setAttribute('title', 'Close CMS Agent');
    if (!state.isInspecting) {
      els.backdrop.style.display = 'block';
    }
  } else {
    els.panel.classList.remove('cap-panel--open');
    els.toggle.classList.remove('cap-toggle--active');
    els.toggle.setAttribute('aria-label', 'Open CMS Agent');
    els.toggle.setAttribute('title', 'Open CMS Agent');
    els.backdrop.style.display = 'none';
  }
}

function renderMessages() {
  var html = '';

  if (state.messages.length === 0) {
    html =
      '<div class="cap-empty-state">' +
        '<p class="cap-empty-state__title">Ask me to edit your content</p>' +
        '<p class="cap-empty-state__hint">Try: &quot;Change the hero title to Welcome&quot; or &quot;Update the about section description&quot;</p>' +
      '</div>';
  } else {
    for (var i = 0; i < state.messages.length; i++) {
      html += renderMessageBubble(state.messages[i]);
    }
  }

  // Loading dots
  if (state.isLoading && state.messages.length > 0 && state.messages[state.messages.length - 1].role !== 'assistant') {
    html +=
      '<div class="cap-message cap-message--assistant">' +
        '<div class="cap-message__bubble cap-message__bubble--loading">' +
          '<span class="cap-loading-dots"><span></span><span></span><span></span></span>' +
        '</div>' +
      '</div>';
  }

  // Error
  if (state.error) {
    html += '<div class="cap-error"><p>' + esc(state.error) + '</p></div>';
  }

  html += '<div id="cap-messages-end"></div>';
  els.messages.innerHTML = html;

  // Auto-scroll
  var end = els.messages.querySelector('#cap-messages-end');
  if (end) end.scrollIntoView({ behavior: 'smooth' });
}

function renderMessageBubble(msg) {
  var isUser = msg.role === 'user';
  var isSystem = msg.role === 'system';
  var roleClass = isSystem ? 'system' : isUser ? 'user' : 'assistant';
  var contentHtml = isSystem
    ? '<p class="cap-message__text">' + esc(msg.content) + '</p>'
    : renderMarkdown(msg.content);

  var changesHtml = '';
  if (msg.proposedChanges && msg.proposedChanges.length > 0) {
    changesHtml = '<div class="cap-changes-inline">';
    for (var i = 0; i < msg.proposedChanges.length; i++) {
      changesHtml += renderChangeCard(msg.proposedChanges[i], true);
    }
    changesHtml += '</div>';
  }

  return (
    '<div class="cap-message cap-message--' + roleClass + '">' +
      '<div class="cap-message__bubble">' +
        contentHtml +
        changesHtml +
      '</div>' +
    '</div>'
  );
}

function renderChangeCard(change, compact) {
  var cls = 'cap-change-card' + (compact ? ' cap-change-card--compact' : '');
  var descHtml = (!compact && change.description)
    ? '<p class="cap-change-card__desc">' + esc(change.description) + '</p>'
    : '';

  return (
    '<div class="' + cls + '">' +
      '<div class="cap-change-card__header">' +
        '<span class="cap-change-card__entity">' + esc(change.entityType) + '</span>' +
        '<span class="cap-change-card__field">' + esc(change.fieldPath) + '</span>' +
      '</div>' +
      '<div class="cap-change-card__diff">' +
        '<div class="cap-change-card__old">' +
          '<span class="cap-change-card__label">Before:</span>' +
          '<span class="cap-change-card__value">' + esc(change.oldValue || '(empty)') + '</span>' +
        '</div>' +
        '<div class="cap-change-card__new">' +
          '<span class="cap-change-card__label">After:</span>' +
          '<span class="cap-change-card__value">' + esc(change.newValue) + '</span>' +
        '</div>' +
      '</div>' +
      descHtml +
    '</div>'
  );
}

function renderCommitToolbar() {
  if (state.proposedChanges.length === 0) {
    els.commitToolbar.style.display = 'none';
    return;
  }

  els.commitToolbar.style.display = 'block';

  var arrow = state.toolbarExpanded ? '\u25BC' : '\u25B6';
  var count = state.proposedChanges.length;
  var previewActiveClass = state.isPreviewActive ? ' cap-btn--preview--active' : '';

  var eyeIcon = state.isPreviewActive
    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>' +
      '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>' +
      '<line x1="1" y1="1" x2="23" y2="23"/>';

  var html =
    '<div class="cap-commit-toolbar__summary">' +
      '<button class="cap-commit-toolbar__toggle" aria-label="Toggle change details">' +
        arrow + ' ' + count + ' pending change' + (count !== 1 ? 's' : '') +
      '</button>' +
      '<div class="cap-commit-toolbar__actions">' +
        '<button class="cap-btn cap-btn--preview' + previewActiveClass + '" ' +
          'title="' + (state.isPreviewActive ? 'Pause live preview' : 'Resume live preview') + '" ' +
          'aria-label="' + (state.isPreviewActive ? 'Pause live preview' : 'Resume live preview') + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          eyeIcon +
          '</svg>' +
        '</button>' +
        '<button class="cap-btn cap-btn--discard"' + (state.isLoading ? ' disabled' : '') + '>Discard</button>' +
        '<button class="cap-btn cap-btn--commit"' + (state.isLoading ? ' disabled' : '') + '>' +
          (state.isLoading ? 'Committing...' : 'Commit All') +
        '</button>' +
      '</div>' +
    '</div>';

  if (state.toolbarExpanded) {
    html += '<div class="cap-commit-toolbar__details">';
    for (var i = 0; i < state.proposedChanges.length; i++) {
      html += renderChangeCard(state.proposedChanges[i], false);
    }
    html += '</div>';
  }

  els.commitToolbar.innerHTML = html;

  // Wire events
  els.commitToolbar.querySelector('.cap-commit-toolbar__toggle').addEventListener('click', function() {
    state.toolbarExpanded = !state.toolbarExpanded;
    renderCommitToolbar();
  });
  els.commitToolbar.querySelector('.cap-btn--preview').addEventListener('click', togglePreview);
  els.commitToolbar.querySelector('.cap-btn--discard').addEventListener('click', function() { discardChanges(); });
  els.commitToolbar.querySelector('.cap-btn--commit').addEventListener('click', function() { doCommit(); });
}

function renderPreviewBanner() {
  if (state.proposedChanges.length === 0) {
    els.previewBanner.style.display = 'none';
    return;
  }

  els.previewBanner.style.display = 'block';
  var count = state.proposedChanges.length;

  if (state.isPreviewActive) {
    els.previewBanner.className = 'cap-preview-banner cap-preview-banner--active';
    els.previewBanner.querySelector('.cap-preview-banner__text').textContent =
      'Preview Mode \u2014 ' + count + ' pending change' + (count !== 1 ? 's' : '');
    els.previewBanner.querySelector('.cap-preview-banner__btn--toggle').textContent = 'Pause';
  } else {
    els.previewBanner.className = 'cap-preview-banner cap-preview-banner--paused';
    els.previewBanner.querySelector('.cap-preview-banner__text').textContent =
      'Preview Paused \u2014 ' + count + ' pending change' + (count !== 1 ? 's' : '') + ' (showing original content)';
    els.previewBanner.querySelector('.cap-preview-banner__btn--toggle').textContent = 'Resume';
  }

  var commitBtn = els.previewBanner.querySelector('.cap-preview-banner__btn--commit');
  commitBtn.textContent = state.isLoading ? 'Committing...' : 'Commit All';
  commitBtn.disabled = state.isLoading;
  els.previewBanner.querySelector('.cap-preview-banner__btn--discard').disabled = state.isLoading;
}

function renderBadge() {
  var count = state.proposedChanges.length;
  if (count > 0) {
    els.badge.textContent = count;
    els.badge.style.display = 'flex';
  } else {
    els.badge.style.display = 'none';
  }
}

function renderSectionBadge() {
  if (!state.selectedSection) {
    els.sectionBadge.style.display = 'none';
    return;
  }

  els.sectionBadge.style.display = 'flex';
  els.sectionBadge.innerHTML =
    '<span class="cap-section-badge__icon">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="12" cy="10" r="3"/>' +
        '<path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z"/>' +
      '</svg>' +
    '</span>' +
    '<span class="cap-section-badge__label">Focused on:</span>' +
    '<span class="cap-section-badge__entity">' + esc(state.selectedSection.entityType) + '</span>' +
    '<span>' + esc(state.selectedSection.label) + '</span>' +
    '<button class="cap-section-badge__clear" title="Clear section focus" aria-label="Clear section focus">&times;</button>';

  els.sectionBadge.querySelector('.cap-section-badge__clear').addEventListener('click', function() {
    selectSection(null);
  });
}

function renderInspectButton() {
  if (!els.inspectBtn) return;
  if (state.isInspecting) {
    els.inspectBtn.classList.add('cap-btn--inspect--active');
  } else {
    els.inspectBtn.classList.remove('cap-btn--inspect--active');
  }
}

function renderInputState() {
  els.input.disabled = state.isLoading;
  els.sendBtn.disabled = state.isLoading || !els.input.value.trim();
}

// --------------- Preview Mechanism for Static Sites ---------------

/**
 * Apply proposed changes directly to the DOM using data-cms attributes.
 * This is the static-site equivalent of the React PreviewProvider.
 *
 * For each proposed change, the fieldPath is expected to match a data-cms attribute
 * or use the format "entityType.fieldName" where we look up the section element.
 */
var originalValues = {}; // key -> original textContent/innerHTML

function applyPreviewToDOM(changes) {
  // Iterate changes and try to apply them to matching DOM elements
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    applyOneChange(change);
  }
}

function applyOneChange(change) {
  // Strategy 1: direct data-cms match on fieldPath
  var el = document.querySelector('[data-cms="' + change.fieldPath + '"]');
  if (el) {
    var key = change.fieldPath;
    if (!(key in originalValues)) {
      originalValues[key] = el.textContent;
    }
    try {
      var newVal = JSON.parse(change.newValue);
      el.textContent = newVal;
    } catch (e) {
      el.textContent = change.newValue;
    }
    return;
  }

  // Strategy 2: try entityType-fieldPath as data-cms key
  // e.g. entityType="hero", fieldPath="tagline" -> data-cms="hero-tagline"
  var cmsKey = change.entityType + '-' + change.fieldPath;
  el = document.querySelector('[data-cms="' + cmsKey + '"]');
  if (el) {
    var key = cmsKey;
    if (!(key in originalValues)) {
      originalValues[key] = el.textContent;
    }
    try {
      var newVal = JSON.parse(change.newValue);
      el.textContent = newVal;
    } catch (e) {
      el.textContent = change.newValue;
    }
    return;
  }

  // Strategy 3: try just fieldPath with common data-cms patterns
  // Some field paths might use dot notation like "hero.tagline"
  var dotParts = change.fieldPath.split('.');
  if (dotParts.length >= 2) {
    cmsKey = dotParts.join('-');
    el = document.querySelector('[data-cms="' + cmsKey + '"]');
    if (el) {
      var key = cmsKey;
      if (!(key in originalValues)) {
        originalValues[key] = el.textContent;
      }
      try {
        var newVal = JSON.parse(change.newValue);
        el.textContent = newVal;
      } catch (e) {
        el.textContent = change.newValue;
      }
    }
  }
}

function restoreOriginalDOM() {
  var keys = Object.keys(originalValues);
  for (var i = 0; i < keys.length; i++) {
    var el = document.querySelector('[data-cms="' + keys[i] + '"]');
    if (el) {
      el.textContent = originalValues[keys[i]];
    }
  }
  originalValues = {};
}

// --------------- Auth Check ---------------

function checkAuth() {
  var token = null;
  try {
    token = localStorage.getItem('cms_auth_token');
  } catch (e) {
    // localStorage not available
  }
  return token;
}

// --------------- Public API ---------------

window.CmsAgentPanel = {
  /**
   * Initialize the CMS Agent Panel on a static HTML site.
   *
   * @param {Object} opts
   * @param {string} opts.graphqlUrl - GraphQL endpoint (default: '/graphql')
   * @param {string} opts.wsUrl - WebSocket URL (optional, derived from graphqlUrl)
   * @param {string} opts.portfolioId - Portfolio ID for multi-tenant resolution
   * @param {Array} opts.sections - Array of { selector, entityType, label }
   * @param {Function} opts.onPreviewChange - Called with proposedChanges array when preview should update
   * @param {Function} opts.onCommitted - Called after successful commit (host should refetch content)
   * @param {Function} opts.onDiscard - Called when changes are discarded (host should restore original)
   */
  init: function(opts) {
    opts = opts || {};
    config.graphqlUrl = opts.graphqlUrl || '/graphql';
    config.wsUrl = opts.wsUrl || null;
    config.portfolioId = opts.portfolioId || null;
    config.sections = opts.sections || [];

    // Set up default preview callbacks using DOM-based preview if host doesn't provide its own
    config.onPreviewChange = opts.onPreviewChange || function(changes) {
      restoreOriginalDOM();
      applyPreviewToDOM(changes);
    };
    config.onCommitted = opts.onCommitted || function() {
      // Default: full page reload to get committed content
      originalValues = {};
      window.location.reload();
    };
    config.onDiscard = opts.onDiscard || function() {
      restoreOriginalDOM();
    };

    // Check for auth token — only build panel if token exists
    config.token = checkAuth();

    function tryBuild() {
      if (config.token) {
        buildPanel();
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryBuild);
    } else {
      tryBuild();
    }

    // Poll for token changes (e.g. user logs in on /admin page and redirects back)
    if (!config.token) {
      var pollId = setInterval(function() {
        var t = checkAuth();
        if (t) {
          config.token = t;
          // Also pick up portfolio ID if stored
          try {
            var raw = localStorage.getItem('cms_selected_portfolio');
            if (raw) {
              var p = JSON.parse(raw);
              config.portfolioId = p.id;
            }
          } catch (e) {}
          clearInterval(pollId);
          buildPanel();
        }
      }, 2000);
    }
  },

  // Expose for programmatic control
  open: openPanel,
  close: closePanel,
  toggle: togglePanel
};
