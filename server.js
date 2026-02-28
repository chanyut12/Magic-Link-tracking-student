const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const pagesRouter = require('./routes/pages');
const apiRouter = require('./routes/api');

app.use('/api', apiRouter);
app.use('/', pagesRouter);

app.listen(PORT, () => {
  console.log(`STS server running at http://localhost:${PORT}`);
});
