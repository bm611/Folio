import { useState, useRef, useEffect, useCallback } from 'react';
import {
  IconSearch,
  IconLayoutSidebarLeftCollapse,
  IconFolder,
  IconFile,
  IconTrash,
  IconEdit,
  IconChevronRight,
  IconChevronDown,
  IconFilePlus,
  IconFolderPlus,
  IconMinus
} from '@tabler/icons-react';

// ─── File Tree Helpers ─────────────────────────────────────────────────────────

export function insertNode(tree, parentId, newNode) {
  if (parentId === null) return [...tree, newNode];
  return tree.map(n => {
    if (n.id === parentId) return { ...n, children: [...(n.children || []), newNode] };
    if (n.children) return { ...n, children: insertNode(n.children, parentId, newNode) };
    return n;
  });
}

export function deleteNode(tree, id) {
  return tree.filter(n => n.id !== id).map(n => n.children ? { ...n, children: deleteNode(n.children, id) } : n);
}

export function renameNode(tree, id, name) {
  return tree.map(n => {
    if (n.id === id) return { ...n, name, title: name }; // update title for notes too
    if (n.children) return { ...n, children: renameNode(n.children, id, name) };
    return n;
  });
}

export function updateFileNode(tree, id, updates) {
  return tree.map(n => {
    if (n.id === id) return { ...n, ...updates };
    if (n.children) return { ...n, children: updateFileNode(n.children, id, updates) };
    return n;
  });
}

export function findFile(nodes, id) {
  for (const n of nodes) {
    if (n.id === id && n.type === "file") return n;
    if (n.children) { const f = findFile(n.children, id); if (f) return f; }
  }
  return null;
}

export function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) { const f = findNode(n.children, id); if (f) return f; }
  }
  return null;
}

export function flattenTree(nodes) {
  let result = [];
  for (const n of nodes) {
    if (n.type === 'file') result.push(n);
    if (n.children) result = result.concat(flattenTree(n.children));
  }
  return result;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ n, s = 14 }) => {
  const props = { size: s, stroke: 1.5, style: { display: "block" } };
  if (n === 'folder') return <IconFolder {...props} />;
  if (n === 'file') return <IconFile {...props} />;
  if (n === 'trash') return <IconTrash {...props} />;
  if (n === 'edit') return <IconEdit {...props} />;
  if (n === 'chevR') return <IconChevronRight {...props} />;
  if (n === 'chevD') return <IconChevronDown {...props} />;
  if (n === 'newFile') return <IconFilePlus {...props} />;
  if (n === 'newFolder') return <IconFolderPlus {...props} />;
  if (n === 'minus') return <IconMinus {...props} />;
  return null;
};

// ─── Tree Node ─────────────────────────────────────────────────────────────────
function TreeNode({ node, depth, activeId, onSelect, onDelete, onRename, expanded, toggleExpand, creatingIn, setCreatingIn, onCreateConfirm }) {
  const [hover, setHover] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const renameRef = useRef(null);
  const isFolder = node.type === "folder";
  const isOpen = expanded.has(node.id);
  const isActive = activeId === node.id;

  useEffect(() => { if (renaming) { renameRef.current?.focus(); renameRef.current?.select(); } }, [renaming]);

  const submitRename = () => { if (renameVal.trim()) onRename(node.id, renameVal.trim()); setRenaming(false); };

  return (
    <div>
      <div
        className={`tree-node${isActive ? " active" : ""}`}
        style={{ paddingLeft: depth * 14 + 8 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => { if (!renaming) { isFolder ? toggleExpand(node.id) : onSelect(node.id); } }}
      >
        <span className={`tn-arrow ${isOpen ? "open" : ""}`} style={{ opacity: isFolder ? 1 : 0 }}>
          <Icon n="chevR" s={11} />
        </span>
        <span className="tn-icon" style={{ color: isFolder ? "var(--h2-color)" : "var(--accent)" }}>
          <Icon n={isFolder ? "folder" : "file"} s={14} />
        </span>
        {renaming ? (
          <input ref={renameRef} className="ren-input" value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={submitRename}
            onKeyDown={e => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") setRenaming(false); }}
            onClick={e => e.stopPropagation()} />
        ) : (
          <span className="tn-name" title={node.name}>{node.name}</span>
        )}
        {hover && !renaming && (
          <span className="tn-actions" onClick={e => e.stopPropagation()}>
            {isFolder && <>
              <button title="New File" onClick={() => { setCreatingIn({ parentId: node.id, type: "file" }); toggleExpand(node.id, true); }}><Icon n="newFile" s={12} /></button>
              <button title="New Folder" onClick={() => { setCreatingIn({ parentId: node.id, type: "folder" }); toggleExpand(node.id, true); }}><Icon n="newFolder" s={12} /></button>
            </>}
            <button title="Rename" onClick={() => setRenaming(true)}><Icon n="edit" s={12} /></button>
            <button title="Delete" onClick={() => onDelete(node.id)} className="hover-danger"><Icon n="trash" s={12} /></button>
          </span>
        )}
      </div>

      {isFolder && isOpen && (
        <div className="tn-children">
          {node.children?.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} activeId={activeId}
              onSelect={onSelect} onDelete={onDelete} onRename={onRename}
              expanded={expanded} toggleExpand={toggleExpand}
              creatingIn={creatingIn} setCreatingIn={setCreatingIn} onCreateConfirm={onCreateConfirm} />
          ))}
          {creatingIn?.parentId === node.id && (
            <InlineCreator depth={depth + 1} type={creatingIn.type}
              onConfirm={(name) => onCreateConfirm(name, creatingIn.parentId, creatingIn.type)}
              onCancel={() => setCreatingIn(null)} />
          )}
        </div>
      )}
    </div>
  );
}

function InlineCreator({ depth, type, onConfirm, onCancel }) {
  const [val, setVal] = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="inline-creator" style={{ paddingLeft: depth * 14 + 8 }}>
      <span className="tn-icon" style={{ color: type === "folder" ? "var(--h2-color)" : "var(--accent)" }}>
        <Icon n={type === "folder" ? "folder" : "file"} s={13} />
      </span>
      <input ref={ref} className="ren-input" value={val} placeholder={type === "folder" ? "folder name" : "file name"}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && val.trim()) onConfirm(val.trim()); if (e.key === "Escape") onCancel(); }}
        onBlur={() => val.trim() ? onConfirm(val.trim()) : onCancel()} />
    </div>
  );
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

export default function Sidebar({
  tree,
  setTree,
  activeNoteId,
  onSelectNote,
  onDeleteNote,
  collapsed,
  onToggleCollapse,
  searchQuery,
  onSearchChange,
  width = 240,
  onResizeStart
}) {
  const [expanded, setExpanded] = useState(new Set([1])); // default expand could be empty or root folder if needed
  const [creatingIn, setCreatingIn] = useState(null);

  const toggleExpand = (id, forceOpen) => setExpanded(prev => {
    const s = new Set(prev);
    if (forceOpen || !s.has(id)) s.add(id); else s.delete(id);
    return s;
  });

  const handleCreateConfirm = (name, parentId, type) => {
    if (type === "folder") {
      const newNode = { id: crypto.randomUUID(), name, type: "folder", children: [] };
      setTree(prev => insertNode(prev, parentId, newNode));
    } else {
      const now = new Date().toISOString()
      const newNode = {
        id: crypto.randomUUID(),
        type: 'file',
        name,
        title: name,
        content: '',
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      setTree(prev => insertNode(prev, parentId, newNode));
      onSelectNote(newNode.id);
      if (window.innerWidth < 768) onToggleCollapse();
    }
    setCreatingIn(null);
  };

  const handleRootCreate = (type) => setCreatingIn({ parentId: null, type });

  // Optional: filter tree based on searchQuery
  const renderTree = () => {
    if (!searchQuery.trim()) return tree;
    const lowerQ = searchQuery.toLowerCase();
    
    // A simple function to filter files by name
    const filterNodes = (nodes) => {
      let result = [];
      for (const node of nodes) {
        if (node.type === 'file' && node.name.toLowerCase().includes(lowerQ)) {
          result.push({ ...node });
        } else if (node.type === 'folder') {
          const filteredChildren = filterNodes(node.children || []);
          if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerQ)) {
            result.push({ ...node, children: filteredChildren });
          }
        }
      }
      return result;
    };
    return filterNodes(tree);
  };

  const visibleTree = renderTree();

  return (
    <>
      <style>{`
        /* Sidebar Styles overriding VS Code base to match canvas */
        .sidebar-vs {
          background: var(--bg-deep);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          user-select: none;
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
        }
        
        .sb-header-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 12px;
          flex-shrink: 0;
        }

        .sb-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          background-image: linear-gradient(to bottom right, var(--text-primary), var(--text-muted));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .sb-actions {
          display: flex;
          gap: 2px;
        }

        .sb-actions button, .tn-actions button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 5px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          line-height: 1;
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .sb-actions button:hover, .tn-actions button:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          transform: scale(1.05);
        }

        .sb-actions button:active, .tn-actions button:active {
          transform: scale(0.95);
        }

        .tn-actions button.hover-danger:hover {
          background: color-mix(in srgb, var(--danger) 15%, transparent);
          color: var(--danger);
        }

        .sb-search-container {
          padding: 0 16px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .sb-search {
          display: flex;
          height: 36px;
          align-items: center;
          gap: 10px;
          border-radius: 10px;
          background: var(--bg-elevated);
          padding: 0 14px;
          border: 1px solid transparent;
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          box-shadow: inset 0 1px 2px color-mix(in srgb, var(--bg-deep) 40%, transparent);
        }

        .sb-search:focus-within {
          border-color: var(--accent);
          box-shadow: inset 0 1px 2px color-mix(in srgb, var(--bg-deep) 40%, transparent), 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
        }

        .sb-search input {
          width: 100%;
          background: transparent;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          border: none;
        }

        .sb-search input::placeholder {
          color: var(--text-muted);
        }

        .sb-tree {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 8px 16px;
        }

        .sb-tree::-webkit-scrollbar {
          width: 5px;
        }

        .sb-tree::-webkit-scrollbar-thumb {
          background: var(--border-subtle);
          border-radius: 3px;
        }

        .sb-tree::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }

        /* Tree node */
        .tree-node {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          margin-bottom: 2px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13.5px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          min-height: 34px;
          position: relative;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .tree-node:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .tree-node.active {
          background: var(--bg-elevated);
          color: var(--text-primary);
          box-shadow: inset 0 0 0 1px var(--border-subtle);
          font-weight: 500;
        }
        
        .tree-node.active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 16px;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: var(--accent);
          opacity: 0.8;
        }

        .tn-arrow {
          min-width: 14px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }
        
        .tn-arrow.open {
          transform: rotate(90deg);
        }

        .tn-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          opacity: 0.85;
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .tree-node:hover .tn-icon {
          transform: scale(1.08);
        }

        .tn-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .tree-node:hover .tn-name {
          transform: translateX(2px);
        }

        .tn-actions {
          display: flex;
          align-items: center;
          gap: 1px;
          margin-left: auto;
          flex-shrink: 0;
          padding: 2px;
          border-radius: 6px;
          background: inherit;
          opacity: 0;
          transform: translateX(5px);
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .tree-node:hover .tn-actions, .tree-node.active .tn-actions {
          opacity: 1;
          transform: translateX(0);
        }

        .tree-node.active .tn-actions {
          background: transparent;
        }

        .ren-input {
          background: var(--bg-surface);
          border: 1px solid var(--accent);
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          padding: 4px 8px;
          border-radius: 6px;
          outline: none;
          width: 100%;
          min-width: 0;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
        }

        .inline-creator {
          display: flex;
          align-items: center;
          padding: 4px 12px;
          margin: 0 8px 4px;
          gap: 8px;
        }
        
        .tn-children {
          animation: slideDown 0.2s cubic-bezier(0.25, 1, 0.5, 1);
          transform-origin: top;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Resize */
        .resize-handle {
          position: absolute;
          top: 0;
          right: 0;
          width: 4px;
          height: 100%;
          cursor: col-resize;
          z-index: 10;
          transition: background 0.2s;
        }

        .resize-handle:hover, .resize-handle:active {
          background: var(--accent);
        }
      `}</style>
      
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden transition-all duration-300"
          onClick={onToggleCollapse}
        />
      )}

      <aside
        className={`sidebar-vs ${collapsed ? 'w-0' : 'max-md:!w-[280px]'} fixed inset-y-0 left-0 z-40 md:relative md:z-auto h-screen shrink-0 overflow-hidden transition-all duration-300`}
        style={{ width: collapsed ? 0 : width, maxWidth: '85vw' }}
      >
        <div className="flex flex-col h-full w-full min-w-[200px]">
          {/* Header */}
          <div className="sb-header-wrapper">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95"
              title="Toggle sidebar (Cmd+B)"
            >
              <IconLayoutSidebarLeftCollapse size={18} stroke={1.5} />
            </button>
            <span className="sb-title">CANVAS</span>
            <div className="sb-actions">
              <button title="New File" onClick={() => handleRootCreate("file")}><Icon n="newFile" s={16} /></button>
              <button title="New Folder" onClick={() => handleRootCreate("folder")}><Icon n="newFolder" s={16} /></button>
            </div>
          </div>

          <div className="sb-search-container">
            <label className="sb-search">
              <IconSearch size={16} stroke={1.5} className="shrink-0 text-[var(--text-muted)] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search notes..."
              />
            </label>
          </div>

          {/* Tree list */}
          <div className="sb-tree">
            {visibleTree.map(node => (
              <TreeNode key={node.id} node={node} depth={0} activeId={activeNoteId}
                onSelect={(id) => {
                  onSelectNote(id);
                  if (window.innerWidth < 768) onToggleCollapse();
                }}
                onDelete={(id) => onDeleteNote(id)}
                onRename={(id, name) => setTree(prev => renameNode(prev, id, name))}
                expanded={expanded} toggleExpand={toggleExpand}
                creatingIn={creatingIn} setCreatingIn={setCreatingIn}
                onCreateConfirm={handleCreateConfirm} />
            ))}
            {creatingIn?.parentId === null && (
              <InlineCreator depth={0} type={creatingIn.type}
                onConfirm={(name) => handleCreateConfirm(name, null, creatingIn.type)}
                onCancel={() => setCreatingIn(null)} />
            )}
            
            {visibleTree.length === 0 && searchQuery.trim() && (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No results found
              </div>
            )}
          </div>
        </div>
        
        {onResizeStart && <div className="resize-handle max-md:hidden" onMouseDown={onResizeStart} />}
      </aside>
    </>
  );
}
