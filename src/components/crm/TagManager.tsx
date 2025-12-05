'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Tag } from '@/types';

// Predefined colors for quick selection
const TAG_COLORS = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f97316', // Orange
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#ef4444', // Red
  '#6b7280', // Gray
];

interface TagWithCount extends Tag {
  leadCount: number;
}

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsChange?: () => void;
}

export function TagManager({ isOpen, onClose, onTagsChange }: TagManagerProps) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      }
    } catch {
      toast.error('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen, fetchTags]);

  // Create tag
  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });

      if (response.ok) {
        const data = await response.json();
        setTags((prev) => [...prev, data.tag].sort((a, b) => a.name.localeCompare(b.name)));
        setNewName('');
        setNewColor(TAG_COLORS[0]);
        setIsCreating(false);
        onTagsChange?.();
        toast.success('Tag created');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create tag');
      }
    } catch {
      toast.error('Failed to create tag');
    }
  };

  // Update tag
  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });

      if (response.ok) {
        const data = await response.json();
        setTags((prev) =>
          prev
            .map((tag) => (tag.id === id ? { ...tag, ...data.tag } : tag))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        setEditingId(null);
        onTagsChange?.();
        toast.success('Tag updated');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update tag');
      }
    } catch {
      toast.error('Failed to update tag');
    }
  };

  // Delete tag
  const handleDelete = async (id: string) => {
    const tag = tags.find((t) => t.id === id);
    if (tag && tag.leadCount > 0) {
      if (!confirm(`This tag is used on ${tag.leadCount} lead(s). Delete anyway?`)) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTags((prev) => prev.filter((tag) => tag.id !== id));
        onTagsChange?.();
        toast.success('Tag deleted');
      } else {
        toast.error('Failed to delete tag');
      }
    } catch {
      toast.error('Failed to delete tag');
    }
  };

  // Start editing
  const startEditing = (tag: TagWithCount) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-medium text-white">Manage Tags</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Existing tags */}
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    {editingId === tag.id ? (
                      /* Edit mode */
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex gap-1">
                            {TAG_COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setEditColor(color)}
                                className={`w-5 h-5 rounded-full transition-transform ${
                                  editColor === color ? 'scale-125 ring-2 ring-white/50' : ''
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white outline-none focus:border-white/20"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdate(tag.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdate(tag.id)}
                          className="p-1.5 rounded text-green-400 hover:bg-green-500/10"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded text-gray-500 hover:bg-white/5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      /* View mode */
                      <>
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 text-sm text-gray-200">{tag.name}</span>
                        <span className="text-xs text-gray-500">{tag.leadCount} leads</span>
                        <button
                          onClick={() => startEditing(tag)}
                          className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {/* Empty state */}
                {tags.length === 0 && !isCreating && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No tags yet</p>
                    <p className="text-xs mt-1">Create your first tag to organize leads</p>
                  </div>
                )}

                {/* Create new tag form */}
                {isCreating && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/20">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewColor(color)}
                            className={`w-5 h-5 rounded-full transition-transform ${
                              newColor === color ? 'scale-125 ring-2 ring-white/50' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Tag name..."
                        className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-600 outline-none focus:border-white/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreate();
                          if (e.key === 'Escape') {
                            setIsCreating(false);
                            setNewName('');
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={handleCreate}
                      className="p-1.5 rounded text-green-400 hover:bg-green-500/10"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewName('');
                      }}
                      className="p-1.5 rounded text-gray-500 hover:bg-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create new tag
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
