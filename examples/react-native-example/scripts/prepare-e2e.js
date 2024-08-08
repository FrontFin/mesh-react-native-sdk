import {writeFileSync} from 'fs';
import {join} from 'path';
import {get} from 'axios';

const ENDPOINT_URL = 'https://integration-api.getfront.com/api/v1/cataloglink';
const CLIENT_ID = process.env.FRONT_CLIENT_ID;
const CLIENT_SECRET = process.env.FRONT_CLIENT_SECRET;

console.log('Preparing e2e...');

const getCatalogLink = async () => {
  console.log('Fetching catalog link...');
  const response = await get(ENDPOINT_URL, {
    headers: {
      ['Content-Type']: 'application/json',
      ['X-Client-Id']: CLIENT_ID,
      ['X-Client-Secret']: CLIENT_SECRET,
    },
    params: {
      userId: 'random',
    },
  });
  const data = response.data;
  console.log('Catalog link fetched', data?.content?.iFrameUrl);
  return data?.content?.iFrameUrl;
};

const prepareE2E = async () => {
  const catalogLink = await getCatalogLink();
  if (!catalogLink) {
    throw new Error('No catalog link found');
  }
  const config = {
    catalogLink,
    fetchedAt: new Date().toISOString(),
  };
  writeFileSync(
    join(__dirname, '..', 'e2e', 'config.json'),
    JSON.stringify(config, null, 2),
  );
  console.log('config.json updated...');
};

prepareE2E()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .then(() => process.exit(0));
