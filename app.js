const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const mysql = require('mysql2')
const db = require('./config/database')
const logreg = require('./routes/login_register_routes')
const findroutes = require('./routes/find_routes')
const donateroutes = require('./routes/donate_routes')
const orderroutes = require('./routes/order_routes')


const app = express();

//Server
const PORT = 8000;
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: 'secureWelcomeHomeKey',
    resave: false,
    saveUninitialized: false,
}));
require('dotenv').config()

// Database Connection

db.connect((err) => {
    if (err) throw err;
    server.listen(PORT, () => {
        console.log(`Server started at ${PORT}`)
    })
});


// Routes
app.use('/', logreg)
app.use('/find', findroutes)
app.use('/donate', donateroutes)
app.use('/order', orderroutes)
