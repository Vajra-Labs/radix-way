const SPECIAL = new Map([
  ['23', '#'],
  ['24', '$'],
  ['26', '&'],
  ['2B', '+'],
  ['2C', ','],
  ['2F', '/'],
  ['3A', ':'],
  ['3B', ';'],
  ['3D', '='],
  ['3F', '?'],
  ['40', '@'],
  ['25', '%'],
]);

export const safeDecodeURI = (path: string, useSemicolonDelimiter = false) => {
  let shouldDecode = false;
  let shouldDecodeParam = false;
  let querystring = '';

  for (let i = 1; i < path.length; i++) {
    const ch = path.charCodeAt(i);
    if (ch === 37) {
      // '%'
      if (i + 2 >= path.length) throw new TypeError('Invalid percent-encoding');
      const h1 = path.charAt(i + 1);
      const h2 = path.charAt(i + 2);
      const hex = (h1 + h2).toUpperCase();
      if (SPECIAL.has(hex)) {
        shouldDecodeParam = true;
        if (hex === '25') {
          // %25 -> we want to treat as encoded percent safe
          shouldDecode = true;
        }
      } else {
        shouldDecode = true;
      }
      i += 2;
      continue;
    }
    if (ch === 63 || ch === 35 || (ch === 59 && useSemicolonDelimiter)) {
      // ? # ;
      querystring = path.slice(i + 1);
      path = path.slice(0, i);
      break;
    }
  }
  const decodedPath = shouldDecode ? decodeURI(path) : path;
  return {path: decodedPath, querystring, shouldDecodeParam};
};

export const safeDecodeURIComponent = (uriComponent: string) => {
  const startIndex = uriComponent.indexOf('%');
  if (startIndex === -1) return uriComponent;
  let out = '';
  let last = startIndex;
  for (let i = startIndex; i < uriComponent.length; i++) {
    if (uriComponent.charCodeAt(i) === 37) {
      if (i + 2 >= uriComponent.length)
        throw new TypeError('Invalid percent-encoding');
      const h1 = uriComponent.charAt(i + 1);
      const h2 = uriComponent.charAt(i + 2);
      const hex = (h1 + h2).toUpperCase();
      const dec = SPECIAL.get(hex) || null;
      if (dec !== null) {
        out += uriComponent.slice(last, i) + dec;
        last = i + 3;
      }
      i += 2;
    }
  }
  return out.length === 0 ? uriComponent : out + uriComponent.slice(last);
};
