import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`AET Hub API rodando na porta ${port}`);
});
