const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Clean URL routing
app.get('/:page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', req.params.page, 'index.html'));
});

app.get('/:section/:page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', req.params.section, req.params.page, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
