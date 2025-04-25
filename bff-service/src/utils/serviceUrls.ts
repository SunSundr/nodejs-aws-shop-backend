const serviceUrls: { [key: string]: string } = {
  products: process.env.URL_PRODUCTS || '',
  cart: process.env.URL_CART || '',
  login: process.env.URL_LOGIN || '',
  register: process.env.URL_REGISTER || '',
};

export const getServiceURL = (serviceName: string): string | undefined => serviceUrls[serviceName];
