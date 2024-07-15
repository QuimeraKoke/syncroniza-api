import express, {Express} from 'express';
const app : Express = express();
const port : number = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
