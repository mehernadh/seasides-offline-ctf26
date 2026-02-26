import React from 'react';

export default function ItemList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="nebula-log empty">
        <p>No records yet. Awaiting input...</p>
      </div>
    );
  }

  return (
    <div className="nebula-log">
      {items.map((item) => (
        <div key={item.id} className="nebula-log-entry">
          {/* Only show name to the user — ID is visible only in network responses */}
          <div className="entry-name">{item.name}</div>
        </div>
      ))}
    </div>
  );
}
