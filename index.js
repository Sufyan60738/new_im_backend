const express = require('express');
const cors = require('cors');
const app = express();



const itemRoutes = require('./src/routes/itemRoutes');
const authRoutes = require('./src/routes/authRoutes');
const unitRoutes = require('./src/routes/unitRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const quoteRoutes = require('./src/routes/quoteRoute');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use('/api', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotes', quoteRoutes);


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
