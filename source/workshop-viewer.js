import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function prepareModel(model){
 const meshes=[],materials=new Set();model.traverse(o=>{if(o.isMesh){meshes.push(o);o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
 const groups=[...new Set(meshes.map(o=>o.userData.partCode||o.parent?.userData.partCode||'Unassigned'))].sort();
 const box=new THREE.Box3().setFromObject(model),span=Math.max(...box.getSize(new THREE.Vector3()).toArray());
 const origins=new Map(meshes.map(o=>[o,o.position.clone()]));
 return {
  bounds:()=>new THREE.Box3().setFromObject(model),
  setColor(hex){for(const m of materials)if(m.name.startsWith('HA_body'))m.color.set(hex);},
  explode(active){model.updateMatrixWorld(true);for(const o of meshes){o.position.copy(origins.get(o));if(active){const key=o.userData.partCode||o.parent?.userData.partCode||'Unassigned',i=groups.indexOf(key),angle=i/groups.length*Math.PI*2;const delta=new THREE.Vector3(Math.cos(angle)*span*.20,(i-(groups.length-1)/2)*span*.11,Math.sin(angle)*span*.14);const q=o.parent.getWorldQuaternion(new THREE.Quaternion()).invert();const scale=o.parent.getWorldScale(new THREE.Vector3());o.position.add(delta.applyQuaternion(q).divide(scale));}}model.updateMatrixWorld(true);},
  dispose(){for(const o of meshes)o.geometry.dispose();for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}},
 };
}

export async function createWorkshopViewer(host,url,{color,view='perspective',signal}={}){
 if(signal?.aborted)throw new Error('Cancelled');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor('#efede6');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const canvas=renderer.domElement;canvas.setAttribute('aria-label','Interactive exterior concept; drag to orbit and pinch or scroll to zoom');canvas.setAttribute('role','img');host.appendChild(canvas);
 const scene=new THREE.Scene(),perspective=new THREE.PerspectiveCamera(35,1,.001,100),front=new THREE.OrthographicCamera(-1,1,1,-1,.001,100);
 let camera=perspective,controls=new OrbitControls(camera,canvas),disposed=false,model,prepared,ground,viewMode=view,observer;
 controls.enableDamping=false;controls.enablePan=false;controls.minDistance=.02;
 const render=()=>{if(!disposed)renderer.render(scene,camera);};controls.addEventListener('change',render);
 const hemi=new THREE.HemisphereLight(0xffffff,0x6d7666,2.0);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xffffff,3.2);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);scene.add(key.target);
 const fill=new THREE.DirectionalLight(0xffffff,1.3);scene.add(fill);
 function fit(){
  if(!prepared||disposed)return;const box=prepared.bounds(),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z,.05);
  if(ground){ground.visible=viewMode!=='exploded';ground.position.set(center.x,box.min.y-.001,center.z);}
  const width=host.clientWidth||600,height=host.clientHeight||450,aspect=width/height;renderer.setSize(width,height,false);
  perspective.aspect=aspect;perspective.updateProjectionMatrix();
  const heightNeeded=Math.max(size.y,size.x/aspect,size.z*.5)*1.35,dist=heightNeeded/(2*Math.tan(THREE.MathUtils.degToRad(perspective.fov/2)));
  perspective.position.copy(center).add(new THREE.Vector3(1.1,.65,1.6).normalize().multiplyScalar(dist*1.4));perspective.near=span/1000;perspective.far=span*100;perspective.updateProjectionMatrix();
  const half=Math.max(size.y,size.x/aspect)*.65;front.left=-half*aspect;front.right=half*aspect;front.top=half;front.bottom=-half;front.position.copy(center).add(new THREE.Vector3(0,0,span*4));front.near=span/1000;front.far=span*100;front.updateProjectionMatrix();
  camera=viewMode==='front'?front:perspective;controls.object=camera;controls.target.copy(center);controls.maxDistance=span*12;controls.update();camera.lookAt(center);
  key.position.copy(center).add(new THREE.Vector3(-1,2,2).multiplyScalar(span*2));key.target.position.copy(center);key.shadow.camera.left=-span*2;key.shadow.camera.right=span*2;key.shadow.camera.top=span*2;key.shadow.camera.bottom=-span*2;key.shadow.camera.near=span/100;key.shadow.camera.far=span*15;key.shadow.normalBias=span*.001;key.shadow.camera.updateProjectionMatrix();fill.position.copy(center).add(new THREE.Vector3(2,1,-1).multiplyScalar(span));render();
 }
 const dispose=()=>{if(disposed)return;disposed=true;observer?.disconnect();controls.removeEventListener('change',render);controls.dispose();prepared?.dispose();scene.traverse(o=>{if(o.userData.studio){o.geometry?.dispose();o.material?.dispose();}});renderer.dispose();renderer.forceContextLoss();canvas.remove();signal?.removeEventListener('abort',dispose);};
 signal?.addEventListener('abort',dispose,{once:true});
 try{
  const gltf=await new GLTFLoader().loadAsync(url);model=gltf.scene;prepared=prepareModel(model);
  if(disposed){prepared.dispose();throw new Error('Cancelled');}
  scene.add(model);prepared.setColor(color||'#93a183');prepared.explode(viewMode==='exploded');
  const b=prepared.bounds(),span=Math.max(...b.getSize(new THREE.Vector3()).toArray());
  ground=new THREE.Mesh(new THREE.PlaneGeometry(span*12,span*12),new THREE.ShadowMaterial({opacity:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=b.min.y-.001;ground.receiveShadow=true;ground.userData.studio=true;scene.add(ground);
  observer=new ResizeObserver(fit);observer.observe(host);fit();
  return {setColor(hex){prepared.setColor(hex);render();},setView(mode){viewMode=mode;prepared.explode(mode==='exploded');fit();},reset(){fit();},dispose};
 }catch(error){dispose();throw error;}
}
