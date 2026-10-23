/** Recover UTF-8 filenames interpreted as Latin-1 by multipart parsers.
 * The BFF forwards multipart data, so legacy names can be encoded twice.
 * Only accept lossless UTF-8 decodes; already valid Unicode stays intact.
 */
export function normalizeFilename(value: string): string {
  let name = value;
  for (let pass = 0; pass < 3; pass++) {
    if ([...name].some(character => character.codePointAt(0)! > 255)) break;
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    if (decoded === name || decoded.includes('\uFFFD')) break;
    name = decoded;
  }
  return name;
}
