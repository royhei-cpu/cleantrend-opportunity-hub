import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.dirname(dir);
const catalogPath=path.join(dir,'catalog.json');
const expectedHash='54d4c8339700d3981dd7b27096f9c22f630f39657c80ed8c9ab4ad19cead1618';
const valid=buffer=>createHash('sha256').update(buffer).digest('hex')===expectedHash;
let catalog=await readFile(catalogPath);
if(!valid(catalog)){
 const publishDir=path.join(root,'.publish');
 const parts=(await readdir(publishDir)).filter(name=>name.startsWith('catalog.part.')).sort();
 if(!parts.length)throw new Error('The verified catalog parts are missing. Do not build from an incomplete source/catalog.json.');
 catalog=Buffer.concat(await Promise.all(parts.map(name=>readFile(path.join(publishDir,name)))));
 if(!valid(catalog))throw new Error('Catalog reconstruction hash mismatch.');
 await writeFile(catalogPath,catalog);
}
const parsed=JSON.parse(catalog);
if(parsed.length!==1918||new Set(parsed.map(product=>product.id)).size!==1918)throw new Error('Catalog reconstruction count mismatch.');
console.log('Verified 1,918-product catalog ready.');
