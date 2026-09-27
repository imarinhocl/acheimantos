require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-troque-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8, // 8 horas
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Acheimantos rodando em http://localhost:${PORT}`);
});
