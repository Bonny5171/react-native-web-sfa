const authWeb = false;

const path = {
  db: '/db/download',
  schema: '/db-schema',
  trackingChanges: '/db-tracking-changes',
  deviceData: '/device-data',
  devices: '/devices'
};

const services = [
  {
    nome: 'setup',
    host: 'https://setup-dev-dot-crmgrendene.appspot.com/api',
    version: '/v1',
    path: path,
    storageDb: 'https://storage.googleapis.com/grensfadbs/dev',
    syncTranckingChange: true,
    syncDeviceData: false,
  },
  {
    nome: 'account',
    host: 'https://account-dev-dot-crmgrendene.appspot.com/api',
    version: '/v1',
    path: path,
    storageDb: 'https://storage.googleapis.com/grensfadbs/dev',
    syncTranckingChange: true,
    syncDeviceData: false,
  },
  {
    nome: 'product',
    host: 'https://product-dev-dot-crmgrendene.appspot.com/api',
    version: '/v1',
    path: path,
    storageDb: 'https://storage.googleapis.com/grensfadbs/dev',
    syncTranckingChange: true,
    syncDeviceData: false,
  },
  {
    nome: 'order',
    host: 'https://order-dev-dot-crmgrendene.appspot.com/api',
    version: '/v1',
    path: path,
    storageDb: 'https://storage.googleapis.com/grensfadbs/dev',
    syncTranckingChange: true,
    syncDeviceData: true,
  },
  {
    nome: 'resource',
    host: 'https://resource-dev-dot-crmgrendene.appspot.com/api',
    version: '/v1',
    path: path,
    storageDb: 'https://storage.googleapis.com/grensfadbs/dev',
    syncTranckingChange: true,
    syncDeviceData: false,
  }
];

const auth = {
          dev: 'https://auth-dev-dot-crmgrendene.appspot.com/',
       client: 'https://auth-dev-dot-crmgrendene.appspot.com/',
   standalone: 'https://auth-dev-dot-crmgrendene.appspot.com/'
};

const log = {
  showSql: false
};

const orgId = '00D6C0000008lo3';

const locales = 'pt-BR';

export {
    services,
    authWeb,
    auth,
    orgId,
    locales,
    log
};

// console.log('.env: %j', process.env);
