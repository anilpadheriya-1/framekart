import React from "react";
import { Link } from "react-router-dom";

export default function EmptyState({ icon = "📭", title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-zinc-300 mb-2">{title}</h3>
      {description && <p className="text-zinc-500 text-sm max-w-xs mb-6">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary text-sm">{actionLabel}</Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary text-sm">{actionLabel}</button>
      )}
    </div>
  );
}
