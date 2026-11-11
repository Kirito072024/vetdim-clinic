import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3001;

createApp().listen(PORT, () => {
  console.log(`ВетДім API працює на http://localhost:${PORT}/api`);
});
