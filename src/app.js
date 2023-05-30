import 'dotenv/config';
import express from 'express';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import cors from 'cors';
import router from './routes';
import authorize from './lib/authorize';
import { connectDatabase } from './config/database';
import path from 'path'

const app = express();

app.use('/uploads', express.static('uploads'));

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

app.use(bodyParser.json());
app.use(cors());

const excludeAuthorization = (req, res, next) => {
  const excludedPaths = ['/api/auth/login', '/api/email/logs/:id/:timeSetId'];
  const currentPath = req.path;
  // Check if the current path matches any of the excluded paths
  const isExcluded = excludedPaths.some((path) => {
    const pathRegex = new RegExp('^' + path.replace(/:[^/]+/g, '[^/]+') + '$');
    return pathRegex.test(currentPath);
  });

  // Bypass authorization if the current path is excluded
  if (isExcluded) {
    return next();
  }

  // Continue to the next middleware for authorization
  return authorize()(req, res, next);
};

app.use(excludeAuthorization);

app.use('/api', router);

app.get("/api/test-login-expired", (req,res) => {
    return res.sendStatus(401);
});

// PORT
const port = process.env.PORT || 3000;

// Starting a server
app.listen(port, () => {
    console.log(`app is running at ${port}`);
    connectDatabase();
});
