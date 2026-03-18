import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search01Icon,
  SidebarLeftIcon,
  Folder01Icon,
  File01Icon,
  Delete01Icon,
  Edit01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  FileAddIcon,
  FolderAddIcon,
  MinusSignIcon,
  Home01Icon,
  Cancel01Icon,
  CloudIcon,
  CloudSavingDone01Icon,
  FloppyDiskIcon,
  Loading01Icon,
} from '@hugeicons/core-free-icons';
import Icon from './Icon';
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

// ─── Icon key → Hugeicons data object map ────────────────────────────────────
const ICON_MAP = {
  folder: Folder01Icon,
  file: File01Icon,
  trash: Delete01Icon,
  edit: Edit01Icon,
  chevR: ArrowRight01Icon,
  chevD: ArrowDown01Icon,
  newFile: FileAddIcon,
  newFolder: FolderAddIcon,
  minus: MinusSignIcon,
}

function SidebarIcon({ n, s = 14 }) {
  const iconData = ICON_MAP[n]
  if (!iconData) return null
  return <Icon icon={iconData} size={s} strokeWidth={1.5} style={{ display: 'block' }} />
}

// ─── Sync Indicator (inline next to app name) ────────────────────────────────
function SyncIndicator({ syncing, syncStatus }) {
  const { user } = useAuth()
  const state = syncStatus?.state

  let icon, iconColor, tooltip, spin = false
  if (!user) {
    icon = FloppyDiskIcon
    iconColor = 'var(--text-muted)'
    tooltip = 'Notes saved locally in your browser'
  } else if (state === 'offline') {
    icon = CloudIcon
    iconColor = 'var(--warning)'
    tooltip = syncStatus?.message || 'Offline — changes are safe locally'
  } else if (state === 'error') {
    icon = CloudIcon
    iconColor = 'var(--danger)'
    tooltip = syncStatus?.error || 'Cloud sync failed'
  } else if (syncing || state === 'syncing') {
    icon = Loading01Icon
    iconColor = 'var(--success)'
    tooltip = 'Saving to cloud…'
    spin = true
  } else {
    icon = CloudSavingDone01Icon
    iconColor = 'var(--success)'
    tooltip = `Synced to cloud as ${user.email}`
  }

  return (
    <span className="sb-sync-indicator" title={tooltip}>
      <Icon icon={icon} size={14} strokeWidth={1.5} style={{ color: iconColor }} className={spin ? 'sync-spin' : ''} />
    </span>
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
          <SidebarIcon n="chevR" s={12} />
        </span>
        <span className="tn-icon">
          <SidebarIcon n={isFolder ? (isOpen ? "folder" : "folder") : "file"} s={14} />
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
              <button title="New File" onClick={() => { setCreatingIn({ parentId: node.id, type: "file" }); toggleExpand(node.id, true); }}><SidebarIcon n="newFile" s={12} /></button>
              <button title="New Folder" onClick={() => { setCreatingIn({ parentId: node.id, type: "folder" }); toggleExpand(node.id, true); }}><SidebarIcon n="newFolder" s={12} /></button>
            </>}
            <button title="Rename" onClick={() => setRenaming(true)}><SidebarIcon n="edit" s={12} /></button>
            <button title="Delete" onClick={() => onDelete(node.id)} className="hover-danger"><SidebarIcon n="trash" s={12} /></button>
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
                  <SidebarIcon n="newFile" s={14} />
                  <span>New File</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setCreatingIn({ parentId: node.id, type: "folder" }); toggleExpand(node.id, true); setContextMenu(null); }}>
                  <SidebarIcon n="newFolder" s={14} />
                  <span>New Folder</span>
                </button>
                <div className="ctx-divider" />
              </>
            ) : null}
            <button onClick={(e) => { e.stopPropagation(); setRenaming(true); setRenameVal(node.name); setContextMenu(null); }}>
              <SidebarIcon n="edit" s={14} />
              <span>Rename</span>
            </button>
            <button className="ctx-danger" onClick={(e) => { e.stopPropagation(); onDelete(node.id); setContextMenu(null); }}>
              <SidebarIcon n="trash" s={14} />
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
        <SidebarIcon n={type === "folder" ? "folder" : "file"} s={13} />
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
  syncStatus = null,
}) {
  const [expanded, setExpanded] = useState(new Set([1])); // default expand could be empty or root folder if needed
  const [creatingIn, setCreatingIn] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [filesOpen, setFilesOpen] = useState(true);
  const searchInputRef = useRef(null);

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

  const visibleFolders = useMemo(() => visibleTree.filter(n => n.type === 'folder'), [visibleTree]);
  const visibleFiles = useMemo(() => visibleTree.filter(n => n.type === 'file'), [visibleTree]);
  const searchExpanded = searchFocused || searchQuery.length > 0;

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
      {/* Mobile backdrop — always in DOM so it can fade out */}
      <div
        className={`fixed inset-0 z-30 md:hidden transition-[opacity,backdrop-filter] duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: collapsed ? 'blur(0px)' : 'blur(4px)' }}
        onClick={onToggleCollapse}
      />

      {/* On mobile this element is always 0-wide in the flex row; the aside is position:fixed and slides over the content */}
      <aside
        className={`sidebar-vs
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:h-[100dvh] max-md:w-[60vw]
          max-md:transition-transform max-md:duration-300 max-md:ease-out
          ${collapsed ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'}
          md:relative md:z-auto md:h-[100dvh] md:shrink-0 md:transition-[width] md:duration-300 md:ease-out`}
        style={{
          // Mobile: no inline width — position:fixed removes it from flow entirely.
          // Desktop: animate width in the flex row.
          width: typeof window !== 'undefined' && window.innerWidth < 768 ? undefined : (collapsed ? 0 : width),
        }}
      >
        <div className="flex flex-col h-full w-full min-w-[200px]">

          {/* Header — app name + sync indicator + collapse icon */}
          <div className="sb-header-wrapper">
            <span className="flex items-center gap-1.5">
              <span className="sb-app-name">Aura</span>
              <SyncIndicator syncing={syncing} syncStatus={syncStatus} />
            </span>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-3 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-all duration-150 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              title="Toggle sidebar (Cmd+B)"
            >
              <Icon icon={SidebarLeftIcon} size={18} stroke={1.5} />
            </button>
          </div>

          {/* Nav items — Home, Search, Sync */}
          <div className="sb-nav-items">
            {/* Home */}
            <button
              className={`sb-nav-item${activeNoteId === null ? ' is-active' : ''}`}
              onClick={() => { onSelectNote(null); if (window.innerWidth < 768) onToggleCollapse(); }}
            >
              <span className="sb-nav-icon">
                <Icon icon={Home01Icon} size={16} stroke={1.5} />
              </span>
              <span className="sb-nav-label">Home</span>
            </button>

            {/* Search — expands inline on click */}
            <div
              className={`sb-nav-item sb-nav-search${searchExpanded ? ' is-expanded' : ''}`}
              onClick={() => {
                if (!searchExpanded) {
                  setSearchFocused(true);
                  setTimeout(() => searchInputRef.current?.focus(), 10);
                }
              }}
            >
              <span className="sb-nav-icon">
                <Icon icon={Search01Icon} size={16} stroke={1.5} />
              </span>
              {searchExpanded ? (
                <>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => { if (!searchQuery) setSearchFocused(false); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="sb-nav-search-clear"
                      onClick={(e) => { e.stopPropagation(); onSearchChange(''); setSearchFocused(false); }}
                      aria-label="Clear search"
                    >
                      <Icon icon={Cancel01Icon} size={12} stroke={2} />
                    </button>
                  )}
                </>
              ) : (
                <span className="sb-nav-label">Search</span>
              )}
            </div>


          </div>

          {/* Tree list */}
          <div className="sb-tree">
            {searchQuery.trim() ? (
              /* Search mode — flat filtered results */
              <>
                {visibleTree.map(node => (
                  <TreeNode key={node.id} node={node} depth={0} activeId={activeNoteId}
                    onSelect={(id) => { onSelectNote(id); if (window.innerWidth < 768) onToggleCollapse(); }}
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
                {visibleTree.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                    No results found
                  </div>
                )}
              </>
            ) : (
              /* Normal mode — Folders + Files sections */
              <>
                {/* Folders section */}
                <div className="sb-section">
                  <div className="sb-section-header">
                    <button className="sb-section-toggle" onClick={() => setFoldersOpen(p => !p)}>
                      <span className={`sb-section-chevron${foldersOpen ? ' open' : ''}`}>
                        <SidebarIcon n="chevR" s={10} />
                      </span>
                      <span>Folders</span>
                    </button>
                    <button className="sb-section-add" title="New Folder" onClick={() => handleRootCreate('folder')}>
                      <SidebarIcon n="newFolder" s={13} />
                    </button>
                  </div>
                  {foldersOpen && (
                    <div className="sb-section-body">
                      {visibleFolders.map(node => (
                        <TreeNode key={node.id} node={node} depth={0} activeId={activeNoteId}
                          onSelect={(id) => { onSelectNote(id); if (window.innerWidth < 768) onToggleCollapse(); }}
                          onDelete={(id) => onDeleteNote(id)}
                          onRename={(id, name) => setTree(prev => renameNode(prev, id, name))}
                          expanded={expanded} toggleExpand={toggleExpand}
                          creatingIn={creatingIn} setCreatingIn={setCreatingIn}
                          onCreateConfirm={handleCreateConfirm} />
                      ))}
                      {creatingIn?.parentId === null && creatingIn.type === 'folder' && (
                        <InlineCreator depth={0} type="folder"
                          onConfirm={(name) => handleCreateConfirm(name, null, 'folder')}
                          onCancel={() => setCreatingIn(null)} />
                      )}
                    </div>
                  )}
                </div>

                {/* Files section */}
                <div className="sb-section">
                  <div className="sb-section-header">
                    <button className="sb-section-toggle" onClick={() => setFilesOpen(p => !p)}>
                      <span className={`sb-section-chevron${filesOpen ? ' open' : ''}`}>
                        <SidebarIcon n="chevR" s={10} />
                      </span>
                      <span>Files</span>
                    </button>
                    <button className="sb-section-add" title="New File" onClick={() => handleRootCreate('file')}>
                      <SidebarIcon n="newFile" s={13} />
                    </button>
                  </div>
                  {filesOpen && (
                    <div className="sb-section-body">
                      {visibleFiles.map(node => (
                        <TreeNode key={node.id} node={node} depth={0} activeId={activeNoteId}
                          onSelect={(id) => { onSelectNote(id); if (window.innerWidth < 768) onToggleCollapse(); }}
                          onDelete={(id) => onDeleteNote(id)}
                          onRename={(id, name) => setTree(prev => renameNode(prev, id, name))}
                          expanded={expanded} toggleExpand={toggleExpand}
                          creatingIn={creatingIn} setCreatingIn={setCreatingIn}
                          onCreateConfirm={handleCreateConfirm} />
                      ))}
                      {creatingIn?.parentId === null && creatingIn.type === 'file' && (
                        <InlineCreator depth={0} type="file"
                          onConfirm={(name) => handleCreateConfirm(name, null, 'file')}
                          onCancel={() => setCreatingIn(null)} />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
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
            <Icon icon={Cancel01Icon} size={24} stroke={2} />
          </button>
        )}

        {onResizeStart && <div className="resize-handle max-md:hidden" onMouseDown={onResizeStart} />}
      </aside>
    </>
  );
}
