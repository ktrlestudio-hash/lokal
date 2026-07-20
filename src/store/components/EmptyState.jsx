import React from 'react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16">
      {Icon && <Icon className="w-12 h-12 text-ink-dim mx-auto mb-3" />}
      <p className="font-semibold text-ink-dim">{title}</p>
      {description && <p className="text-sm text-ink-dim mt-1">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-5 py-2.5 bg-surface-card-2 rounded-xl font-semibold text-sm hover:bg-surface-card-2 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
