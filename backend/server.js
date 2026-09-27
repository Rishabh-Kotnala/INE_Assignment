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

// Route: Trigger scraping job
app.post('/api/scrape', async (req, res) => {
    // Respond quickly for cron jobs, run scraping in background
    res.json({ message: 'Scraping job started' });
    runScrapeJob().catch(console.error);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
