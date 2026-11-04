"""Assemble and validate self-contained White Label Workshop archives."""
import hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/workshop'
data=json.loads((ROOT/'source/workshop-data.json').read_text())
manifest={'revision':'A0','authoredAt':data['authoredAt'],'blenderVersion':'5.2.2 LTS','concepts':[],'files':[]}
for backup in ASSETS.glob('*.blend1'):backup.unlink()
for p in data['concepts']:
    ident=p['id'];assets=[ASSETS/f'{ident}{ext}' for ext in ['.blend','.glb','.jpg','-front.jpg','-dimensions.svg','-geometry.json']]
    geometry=json.loads((ASSETS/f'{ident}-geometry.json').read_text())
    assert geometry['primaryDimensionsMm']==p['envelope']
    assert set(geometry['partCodes']).issubset({r['code'] for r in p['parts']})
    pack=ASSETS/f'{ident}-development-pack.zip'
    with zipfile.ZipFile(pack,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for file in assets:z.write(file,file.name)
        for file in (ROOT/'workshop/generated'/ident).iterdir():z.write(file,file.name)
        z.write(ROOT/'workshop/blender_workshop.py','blender_workshop.py')
    with zipfile.ZipFile(pack) as z:
        assert z.testzip() is None
        assert len(z.namelist())==11
    manifest['concepts'].append({'id':ident,'code':p['code'],'primaryDimensionsMm':geometry['primaryDimensionsMm'],'partCodes':geometry['partCodes'],'archiveEntries':11})
    for file in assets+[pack]:
        content=file.read_bytes()
        manifest['files'].append({'path':'assets/workshop/'+file.name,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
(ROOT/'source/workshop-assets.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'concepts':len(manifest['concepts']),'verifiedFiles':len(manifest['files']),'bytes':sum(f['bytes'] for f in manifest['files'])}))
