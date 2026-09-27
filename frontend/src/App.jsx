import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Plus, Download, RefreshCw, AlertCircle } from 'lucide-react';
import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchUrl, setSearchUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('Products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setTrackedProducts(data);
      if (data.length > 0 && !selectedProduct) {
        handleSelectProduct(data[0]);
      }
    }
    setLoading(false);
  };

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    const { data, error } = await supabase
      .from('ScrapeHistory')
      .select('*')
      .eq('product_id', product.id)
      .order('timestamp', { ascending: true });
    
    if (!error && data) {
      setHistory(data.map(d => ({
        ...d,
        timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateLabel: new Date(d.timestamp).toLocaleDateString()
      })));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!searchUrl) return;
    setAdding(true);
    
    // Parse URL for ID or Slug (simplified for demo)
    const urlParts = searchUrl.split('/');
    const slugOrId = urlParts[urlParts.length - 1];
    const name = `Tracked Item ${slugOrId}`;
    
    const { data, error } = await supabase.from('Products').insert([{
      product_name: name,
      selected_option: 'Default',
      product_url: searchUrl
    }]).select();

    if (!error && data) {
      setSearchUrl('');
      fetchProducts();
    }
    setAdding(false);
  };

  const exportCSV = () => {
    if (!history.length) return;
    
    const headers = ['Product ID', 'Timestamp (UTC)', 'Price', 'Stock', 'Outcome'];
    const csvContent = [
      headers.join(','),
      ...history.map(row => [
        row.product_id,
        row.timestamp,
        row.price || '',
        row.stock ? 'In Stock' : (row.stock === false ? 'Out of Stock' : ''),
        row.outcome
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scrape_history_${selectedProduct?.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>INE Price Tracker</h1>
        <p>Monitor mock store prices and stock over time.</p>
      </header>

      <div className="main-grid">
        <aside className="sidebar">
          <form onSubmit={handleAddProduct} className="add-form">
            <input 
              type="url" 
              placeholder="Paste product URL..." 
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              required
            />
            <button type="submit" disabled={adding}>
              {adding ? <RefreshCw className="spin" size={18} /> : <Plus size={18} />}
            </button>
          </form>

          <div className="product-list">
            <h3>Tracked Products</h3>
            {loading ? <p>Loading...</p> : (
              <ul>
                {trackedProducts.map(p => (
                  <li 
                    key={p.id} 
                    className={selectedProduct?.id === p.id ? 'active' : ''}
                    onClick={() => handleSelectProduct(p)}
                  >
                    <strong>{p.product_name}</strong>
                    <span>{p.selected_option}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="dashboard">
          {selectedProduct ? (
            <div className="dashboard-content">
              <div className="dash-header">
                <h2>{selectedProduct.product_name}</h2>
                <button onClick={exportCSV} className="btn-export">
                  <Download size={16} /> Export CSV
                </button>
              </div>
              
              <div className="chart-container">
                <h3>Price History</h3>
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={history.filter(h => h.price)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeLabel" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">
                    <AlertCircle size={32} />
                    <p>No successful scrapes yet. Check back after the next schedule.</p>
                  </div>
                )}
              </div>

              <div className="log-container">
                <h3>Scrape Log</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Outcome</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map(log => (
                      <tr key={log.id} className={`outcome-${log.outcome}`}>
                        <td>{log.dateLabel} {log.timeLabel}</td>
                        <td>
                          <span className={`badge ${log.outcome}`}>{log.outcome}</span>
                        </td>
                        <td>{log.price ? `$${log.price}` : '-'}</td>
                        <td>{log.stock === null ? '-' : (log.stock ? 'Yes' : 'No')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-dashboard">
              <p>Select a product to view its dashboard.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
