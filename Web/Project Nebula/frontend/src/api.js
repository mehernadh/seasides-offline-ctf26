const API_BASE = import.meta.env.VITE_API_BASE || '';

// REST endpoints used by UI
export async function listItems(){
  const res = await fetch(`${API_BASE}/api/items`);
  return res.json();
}

export async function createItem(name){
  const res = await fetch(`${API_BASE}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return res.json();
}
