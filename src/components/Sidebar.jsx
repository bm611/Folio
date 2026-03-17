import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  IconSearch,
  IconLayoutSidebarFilled,
  IconFolder,
  IconFile,
  IconTrash,
  IconEdit,
  IconChevronRight,
  IconChevronDown,
  IconFilePlus,
  IconFolderPlus,
  IconMinus,
  IconHome,
  IconX,
  IconCloud,
  IconCloudCheck,
  IconDeviceFloppy,
  IconLoader2,
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

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

// ─── Sync Status Badge ────────────────────────────────────────────────────────
function SyncBadge({ syncing }) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="sync-badge sync-badge--local" title="Notes saved locally in your browser">
        <IconDeviceFloppy size={13} stroke={1.5} />
        <span>Local</span>
      </div>
    )
  }

  if (syncing) {
    return (
      <div className="sync-badge sync-badge--syncing" title="Saving to cloud…">
        <IconLoader2 size={13} stroke={2} className="sync-spin" />
        <span>Syncing…</span>
      </div>
    )
  }

  return (
    <div className="sync-badge sync-badge--synced" title={`Synced to cloud as ${user.email}`}>
      <IconCloudCheck size={13} stroke={1.5} />
      <span>Synced</span>
    </div>
  )
}

// ─── Tree Node ─────────────────────────────────────────────────────────────────
function TreeNode({ node, depth, activeId, onSelect, onDelete, onRename, expanded, toggleExpand, creatingIn, setCreatingIn, onCreateConfirm }) {
  const [hover, setHover] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.name);
  const [contextMenu, setContextMenu] = useState(null); // { x, y } or null
  const renameRef = useRef(null);
  const longPressRef = useRef(null);
  const nodeRef = useRef(null);
  const isFolder = node.type === "folder";
  const isOpen = expanded.has(node.id);
  const isActive = activeId === node.id;

  useEffect(() => { if (renaming) { renameRef.current?.focus(); renameRef.current?.select(); } }, [renaming]);

  const submitRename = () => { if (renameVal.trim()) onRename(node.id, renameVal.trim()); setRenaming(false); };

  const handleTouchStart = (e) => {
    // If already renaming, don't start long press
    if (renaming) return;
    
    const touch = e.touches[0];
    const rect = nodeRef.current?.getBoundingClientRect();
    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(12); // Slightly stronger vibration for feedback
      setContextMenu({
        x: Math.min(touch.clientX, window.innerWidth - 180),
        y: rect ? rect.bottom + 4 : touch.clientY,
      });
      longPressRef.current = null;
    }, 550); // Slightly longer for clearer intent
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  // Close context menu when tapping elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    
    // We add a tiny delay to prevent the initial long-press from immediately closing the menu
    const timer = setTimeout(() => {
      window.addEventListener('click', close);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', close);
    };
  }, [contextMenu]);

  return (
    <div>
      <div
        ref={nodeRef}
        className={`tree-node ${isFolder ? "is-folder" : "is-file"}${isActive ? " active" : ""}`}
        style={{ paddingLeft: depth * 14 + 10 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onClick={(e) => { 
          if (!renaming && !contextMenu && !longPressRef.current) { 
            isFolder ? toggleExpand(node.id) : onSelect(node.id); 
          } else if (contextMenu) {
            e.stopPropagation();
          }
        }}
      >
        <span className={`tn-arrow relative after:absolute after:-inset-2 ${isOpen ? "open" : ""}`} style={{ opacity: isFolder ? 1 : 0 }}>
          <Icon n="chevR" s={12} />
        </span>
        <span className="tn-icon">
          <Icon n={isFolder ? (isOpen ? "folder" : "folder") : "file"} s={14} />
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
            <button title="Rename" onClick={() => setRenaming(true)} className="relative transition-transform active:scale-[0.9] after:absolute after:-inset-2"><Icon n="edit" s={12} /></button>
            <button title="Delete" onClick={() => onDelete(node.id)} className="hover-danger relative transition-transform active:scale-[0.9] after:absolute after:-inset-2"><Icon n="trash" s={12} /></button>
          </span>
        )}
      </div>

      {/* Long-press context menu */}
      {contextMenu && (
        <div className="ctx-menu-overlay" onClick={() => setContextMenu(null)}>
          <div
            className="ctx-menu animate-ctx-fade-in"
            style={{ top: contextMenu.y, left: contextMenu.x, transformOrigin: 'top center' }}
            onClick={e => e.stopPropagation()}
          >
            {isFolder ? (
              <>
                <button onClick={(e) => { e.stopPropagation(); setCreatingIn({ parentId: node.id, type: "file" }); toggleExpand(node.id, true); setContextMenu(null); }}>
                  <Icon n="newFile" s={14} />
                  <span>New File</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setCreatingIn({ parentId: node.id, type: "folder" }); toggleExpand(node.id, true); setContextMenu(null); }}>
                  <Icon n="newFolder" s={14} />
                  <span>New Folder</span>
                </button>
                <div className="ctx-divider" />
              </>
            ) : null}
            <button onClick={(e) => { e.stopPropagation(); setRenaming(true); setRenameVal(node.name); setContextMenu(null); }}>
              <Icon n="edit" s={14} />
              <span>Rename</span>
            </button>
            <button className="ctx-danger" onClick={(e) => { e.stopPropagation(); onDelete(node.id); setContextMenu(null); }}>
              <Icon n="trash" s={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {isFolder && isOpen && (
        <div className="tn-children">
          <div className="tn-children-line" style={{ left: depth * 14 + 16 }} />
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
    <div className="inline-creator" style={{ paddingLeft: depth * 14 + 10 }}>
      <span className="tn-icon">
        <Icon n={type === "folder" ? "folder" : "file"} s={13} />
      </span>
      <input ref={ref} className="ren-input focus:border-[var(--accent)]" value={val} placeholder={type === "folder" ? "folder name" : "file name"}
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
  onResizeStart,
  syncing = false,
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

  const visibleTree = useMemo(() => {
    // Sort a list of nodes so folders come first
    const sortNodes = (nodes) => {
      return [...nodes].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        // Optional: alphabetical sort for nodes of the same type
        return a.name.localeCompare(b.name);
      }).map(node => {
        if (node.type === 'folder' && node.children) {
          return { ...node, children: sortNodes(node.children) };
        }
        return node;
      });
    };

    if (!searchQuery.trim()) return sortNodes(tree);
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
    return sortNodes(filterNodes(tree));
  }, [tree, searchQuery]);

  const getVisibleFiles = useCallback((nodes) => {
    let result = [];
    for (const node of nodes) {
      if (node.type === 'file') result.push(node);
      if (node.type === 'folder' && expanded.has(node.id) && node.children) {
        result = result.concat(getVisibleFiles(node.children));
      }
    }
    return result;
  }, [expanded]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const files = getVisibleFiles(visibleTree);
        if (files.length === 0) return;

        let currentIndex = files.findIndex(f => f.id === activeNoteId);
        let nextIndex = currentIndex;

        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
          if (currentIndex === -1) nextIndex = files.length > 0 ? files.length - 1 : -1;
        } else if (e.key === 'ArrowDown') {
          nextIndex = currentIndex !== -1 && currentIndex < files.length - 1 ? currentIndex + 1 : currentIndex;
          if (currentIndex === -1) nextIndex = 0;
        }
        
        if (nextIndex !== -1 && nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < files.length) {
          e.preventDefault();
          onSelectNote(files[nextIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNoteId, visibleTree, getVisibleFiles, onSelectNote]);

  useEffect(() => {
    const activeNode = document.querySelector('.tree-node.active');
    if (activeNode) {
      activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeNoteId]);

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden transition-all duration-300"
          onClick={onToggleCollapse}
        />
      )}

      <aside
        className={`sidebar-vs ${collapsed ? 'w-0' : 'max-md:!w-full'} fixed inset-y-0 left-0 z-40 md:relative md:z-auto h-[100dvh] shrink-0 overflow-hidden transition-all duration-300`}
        style={{ width: collapsed ? 0 : width, maxWidth: '100vw' }}
      >
        <div className="flex flex-col h-full w-full min-w-[200px]">
          {/* Header */}
          <div className="sb-header-wrapper">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-3 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-all duration-150 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              title="Toggle sidebar (Cmd+B)"
            >
              <IconLayoutSidebarFilled size={18} stroke={1.5} />
            </button>

            <div className="sb-actions">
              <button title="Home" onClick={() => { onSelectNote(null); if (window.innerWidth < 768) onToggleCollapse(); }} className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-3"><IconHome size={16} stroke={1.5} /></button>
            </div>
          </div>

          {/* New file / folder buttons */}
          <div className="flex items-center gap-1.5 px-3 pb-2">
            <button
              onClick={() => handleRootCreate("file")}
              className="sb-create-btn flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] active:scale-[0.97]"
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              <IconFilePlus size={14} stroke={1.5} />
              New File
            </button>
            <button
              onClick={() => handleRootCreate("folder")}
              className="sb-create-btn flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] active:scale-[0.97]"
              style={{ fontFamily: '"Outfit", sans-serif' }}
            >
              <IconFolderPlus size={14} stroke={1.5} />
              New Folder
            </button>
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
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-3 shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                  aria-label="Clear search"
                >
                  <IconX size={12} stroke={2} />
                </button>
              )}
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

          {/* Sync status footer */}
          <div className="sb-footer">
            <SyncBadge syncing={syncing} />
          </div>
        </div>

        {/* Mobile close button */}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-3 md:hidden absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xl backdrop-blur-xl transition-all active:scale-95"
            aria-label="Close sidebar"
          >
            <IconX size={24} stroke={2} />
          </button>
        )}

        {onResizeStart && <div className="resize-handle max-md:hidden" onMouseDown={onResizeStart} />}
      </aside>
    </>
  );
}
