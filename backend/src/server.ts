import app from './app';
import config from './config';

const PORT = config.app.port || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
