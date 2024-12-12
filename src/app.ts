import express, {Express} from 'express';import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connect from "./config/mongo.config";

import authRouter from "./routes/auth.router";
import appRouter from "./routes/app.router";
import oauthMiddle from "./middleware/oauth.middle";

const app : Express = express();
const port : number = 3000;

connect()

const whiteList = [
    "https://e49c-200-28-224-90.ngrok-free.app",
    "http://localhost:3001"
]

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || whiteList.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error(`Site: ${origin} not allowed by CORS`));
        }
    },
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use('/auth', authRouter);
app.use('/', oauthMiddle, appRouter);


app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
