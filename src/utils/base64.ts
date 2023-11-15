const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

type numberOrString = number | string;

export const decode64 = (input: string) => {
  let output = '';
  let chr1, chr2, chr3: numberOrString = '';
  let enc1, enc2, enc3, enc4: numberOrString = '';
  let ind = 0;

  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  const base64test = /[^A-Za-z0-9+/=]/g;

  if (base64test.exec(input)) {
    throw new Error(`There were invalid base64 characters in the input text. Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='`);
  }

  input = input.replace(/[^A-Za-z0-9+/=]/g, '');

  do {
    enc1 = keyStr.indexOf(input.charAt(ind++));
    enc2 = keyStr.indexOf(input.charAt(ind++));
    enc3 = keyStr.indexOf(input.charAt(ind++));
    enc4 = keyStr.indexOf(input.charAt(ind++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 != 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 != 64) {
      output = output + String.fromCharCode(chr3);
    }

    chr1 = '';
    chr2 = '';
    chr3 = '';
    enc1 = '';
    enc2 = '';
    enc3 = '';
    enc4 = '';
  } while (ind < input.length);

  return output;
};
