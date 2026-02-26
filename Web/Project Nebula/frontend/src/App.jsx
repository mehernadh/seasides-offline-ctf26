import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import ItemList from './components/ItemList';
import { listItems, createItem } from './api';
import './styles.css';

export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const data = await listItems();
      setItems(data);
    } catch (e) { console.error(e); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const newItem = await createItem(name);
      setItems(prev => [newItem, ...prev]);
      setName('');
    } catch (e) { console.error(e); }
  }

  return (
    <div className="nebula-container">
      <Header />

      <main className="nebula-dashboard">
        <section className="nebula-panel add-panel">
          <h2>Add New Entry</h2>
          <form onSubmit={handleAdd} className="nebula-form">
            <input
              className="nebula-input"
              placeholder="Enter record name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button className="nebula-button" type="submit">
              Submit
            </button>
          </form>
        </section>

        <section className="nebula-panel list-panel">
          <h2>Data Records</h2>
          <ItemList items={items} />
        </section>
      </main>

      <footer className="nebula-footer">
        <p>© Project Nebula Systems — DataCore v1.0</p>
      </footer>
    </div>
  );
}
