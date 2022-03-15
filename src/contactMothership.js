import { app } from 'electron';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

export function getUrlAndTokenString() {
  const inProduction = app.isPackaged;
  const empty = { url: '', telemetryUrl: '', tokenString: '' };
  let errLogCredsPath = path.join(
    process.resourcesPath,
    '../creds/log_creds.txt'
  );
  if (!fs.existsSync(errLogCredsPath)) {
    errLogCredsPath = path.join(__dirname, '../log_creds.txt');
  }

  if (!fs.existsSync(errLogCredsPath)) {
    !inProduction && console.log(`${errLogCredsPath} doesn't exist, can't log`);
    return empty;
  }

  let apiKey, apiSecret, url, telemetryUrl;
  try {
    [apiKey, apiSecret, url, telemetryUrl] = fs
      .readFileSync(errLogCredsPath, 'utf-8')
      .split('\n')
      .filter((f) => f.length);
  } catch (err) {
    if (!inProduction) {
      console.log(`logging error using creds at: ${errLogCredsPath} failed`);
      console.log(err);
    }
    return empty;
  }

  return {
    url: encodeURI(url),
    telemetryUrl: encodeURI(telemetryUrl),
    tokenString: `token ${apiKey}:${apiSecret}`,
  };
}

function post(bodyJson) {
  const inProduction = app.isPackaged;
  const { url, tokenString } = getUrlAndTokenString();
  const isHttps = url.split(':')[0].toLowerCase() === 'https';
  const headers = {
    Authorization: tokenString,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const req = (isHttps ? https : http).request(
    url,
    {
      method: 'POST',
      headers,
    },
    (res) => {
      if (inProduction) {
        return;
      }

      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
      });
    }
  );

  req.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
  });
  req.write(bodyJson);
  req.end();
}

export function sendError(bodyJson) {
  post(bodyJson);
}

// Nothing nefarious going on here.
// Just regular old user mandated error logging.
