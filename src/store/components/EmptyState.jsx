import React from 'react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16">
      {Icon && <Icon className="w-12 h-12 text-slate-200 mx-auto mb-3" />}
      <p className="font-semibold text-slate-400">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-5 py-2.5 bg-slate-100 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
