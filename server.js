require('dotenv').config();
const express = require('express');
const sequelize = require('./app/database/db');

const app = express(); 

const PORT = process.env.PORT || 3000

const path = require('path')
const bodyParser  = require('body-parser')

const ErrorHandler = require('./app/middleware/ErrorHandler.middleware');


 (async () => {
    try {
      await sequelize.sync({ alter: true }); // or force: true if you want to drop & recreate
      console.log("Database Synced Successfully 🦋");
    } catch (err) {
      console.error("❌ Database sync failed:", err);
    }
  })(); 
 

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

// Handling CORS Error
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }

  next();
});

// Configure Handlebars (Optional, for potential views)
// const { engine } = require("express-handlebars");
// app.engine("hbs", engine({ 
//   extname: ".hbs", 
//   defaultLayout: "main",
//   runtimeOptions: {
//     allowProtoPropertiesByDefault: true,
//     allowProtoMethodsByDefault: true
//   }
// }));
// app.set("view engine", "hbs");
// app.set("views", path.join(__dirname, "views"));

// Routes
const loanRoutes = require('./app/routes/loan.routes');
const invoiceRoutes = require('./app/routes/invoice.routes');
const ledgerRoutes = require('./app/routes/ledger.routes');
const jobRoutes = require('./app/routes/job.routes');

app.use('/loans', loanRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/ledger', ledgerRoutes);
app.use('/jobs', jobRoutes);


  //Error Handling 
  ErrorHandler(app)

  
  app.listen(PORT, () => {
      console.log(`Server started running on port ${PORT}`);
    });