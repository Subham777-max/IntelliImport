import app from './src/app.js';
import connectDatabase from './src/config/db.js';



connectDatabase();

app.listen(3000, () => {
  console.log(`Backend running on http://localhost:3000`);
});
