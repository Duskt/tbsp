export function cookieReader(request: Request) {
  // true if valid
  // false if no header on request
  // throw error if invalid cookie found
  console.log(request.headers);
  return request.headers.get('cookie');
}
