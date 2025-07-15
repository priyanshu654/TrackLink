require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express'); // Include the express module
const cookieParser = require('cookie-parser');
const authRoutes = require('./src/routes/authRoutes');
const linksRoutes = require('./src/routes/linksRoutes');
const userRoutes = require('./src/routes/userRoutes');
const paymentRoutes=require("./src/routes/paymentRouter");
const cors = require('cors');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => console.log(error));

const app = express(); // Instantiate express app.

//we dont want to apply this middleware on webhooks routes so 
//app.use(express.json()); // Middleware to convert json to javascript object.
//this is to avoid applying on webhooks routess
app.use((req,res,next)=>{
    if(req.originalUrl.startsWith('/payment/webhook')){
        next();
    }

    express.json()(req,res,next);
})


app.use(cookieParser());

const corsOptions = {
    origin: process.env.CLIENT_ENDPOINT,
    credentials: true
};
app.use(cors(corsOptions));
app.use('/auth', authRoutes);
app.use('/links', linksRoutes);
app.use('/users', userRoutes);
app.use('/payment',paymentRoutes);

const PORT = 5001;
app.listen(5001, (error) => {
    if (error) {
        console.log('Error starting the server: ', error);
    } else {
        console.log(`Server is running at http://localhost:${PORT}`);
    }
});