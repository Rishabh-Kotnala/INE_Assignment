require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { runScrapeJob } = require('./scraper');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Route: Get all tracked products
app.get('/api/products', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { data, error } = await supabase.from('Products').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Route: Get history for a product
app.get('/api/products/:id/history', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    const { id } = req.params;
    const { data, error } = await supabase
        .from('ScrapeHistory')
        .select('*')
        .eq('product_id', id)
        .order('timestamp', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Route: Add a product (so frontend can add via API instead of direct supabase if needed)
app.post('/api/products', async (req, res) => {
    const { product_name, product_url, selected_option } = req.body;
    const { data, error } = await supabase.from('Products').insert([{ product_name, product_url, selected_option }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// Route: Search proxy to bypass CORS
let cachedItems = null;
app.get('/api/search', async (req, res) => {
    try {
        const q = (req.query.q || '').toLowerCase();
        
        // Cache the items to avoid spamming the mock store
        if (!cachedItems) {
            let allItems = [];
            // Fetch first 5 pages to have a good pool of products
            for(let i=1; i<=5; i++) {
                const response = await fetch(`https://demo.inelabteamdev.com/api/v2/listings?page=${i}&limit=60`);
                const data = await response.json();
                if (data.results) allItems = allItems.concat(data.results);
            }
            cachedItems = allItems;
        }

        const matches = cachedItems.filter(item => item.name.toLowerCase().includes(q)).slice(0, 10);
        res.json(matches);
    } catch(e) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Route: Trigger scraping job
app.post('/api/scrape', async (req, res) => {
    // Respond quickly for cron jobs, run scraping in background
    res.json({ message: 'Scraping job started' });
    runScrapeJob().catch(console.error);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
