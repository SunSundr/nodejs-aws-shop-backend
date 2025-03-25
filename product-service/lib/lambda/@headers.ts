export function getHeaders(methods: string[] = []) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods.length
      ? methods.join(', ')
      : 'OPTIONS, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}
