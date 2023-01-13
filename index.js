const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const router = require('./src/router/index');
const Middleware = require('./src/middlewares/error-middleware');

const PORT = 5000;
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: 'http://localhost:8080',
}));
app.use(router);
app.use(Middleware);

const start = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server started on PORT = ${PORT}`);
        });
    } catch (error) {
        console.log(error);
    }
};

start();
