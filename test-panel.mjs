import assert from 'node:assert';
import {readFileSync} from 'node:fs';
const src = readFileSync('admin.html','utf8').split('<script>')[1].split('</script>')[0];
// Stub mínimo de navegador para probar filtros y export
const vals = {desde:'', hasta:''};
const el = id => ({ get value(){return vals[id] ?? '';}, set value(v){vals[id]=v;}, addEventListener(){}, style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false}}, set innerHTML(v){this._h=v}, set textContent(v){this._t=v}, querySelectorAll:()=>[], querySelector:()=>null, click(){}, dataset:{} });
let descargado = null;
global.document = { getElementById: el, querySelector: () => el('x'), querySelectorAll: () => [],
  createElement: t => t==='a' ? {set href(v){}, get href(){return 'x'}, click(){descargado=this.download}, download:''} : el('x') };
global.URL = { createObjectURL: b => { global.__blob = b; return 'blob:'; }, revokeObjectURL(){} };
global.Blob = class { constructor(p){ this.texto = p.join(''); } };
global.alert = m => { throw new Error('alert: '+m); };
global.fetch = async () => ({ok:true, json:async()=>({})});
const mod = new Function(src + '; return {rangoActivo, filtradas, descargarExcel, set todas(v){todas=v}, set preguntas(v){preguntas=v}, set filtro(v){filtro=v}, set periodo(v){periodo=v}};')();

const hoy = new Date();
const enMes = (delta, dia=15) => new Date(hoy.getFullYear(), hoy.getMonth()+delta, dia, 12).toISOString();
mod.todas = [
  {creado_en: enMes(0), servicio:'recepcion', rol:'recepcion', calificacion:5, personal_nombre:'Ana; "A"', motivos:['trato'], comentario:'muy bien', adjuntos:[]},
  {creado_en: enMes(-1), servicio:'emergencia', rol:'enfermeria', calificacion:2, personal_nombre:'Luz', motivos:['brusco'], aspectos:{cuidado:2}, recomienda:false, adjuntos:[]},
  {creado_en: enMes(-4), servicio:'emergencia', rol:'medico', calificacion:4, personal_nombre:'Dr X', motivos:[], adjuntos:[]},
  {creado_en: enMes(-5), servicio:'emergencia', rol:'obstetra', calificacion:3, personal_nombre:'Obst Y', motivos:['privacidad'], aspectos:{privacidad:3}, adjuntos:[]},
];
mod.preguntas = [
  {rol:'enfermeria', tipo:'aspecto', clave:'cuidado', texto:'Cuidado al inyectar', activo:true},
  {rol:'obstetra', tipo:'aspecto', clave:'privacidad', texto:'Respeto a tu privacidad', activo:true},
  {rol:'obstetra', tipo:'motivo', clave:'privacidad', texto:'No respetaron mi privacidad', activo:true},
];
const n = () => mod.filtradas().length;
mod.periodo='todo'; assert.equal(n(), 4, 'todo');
mod.periodo='mes'; assert.equal(n(), 1, 'este mes');
mod.periodo='mes-pasado'; assert.equal(n(), 1, 'mes pasado');
mod.periodo='90'; assert.equal(n(), 2, '3 meses');
mod.periodo='todo'; mod.filtro='enfermeria'; assert.equal(n(), 1, 'enfermeria');
mod.filtro='recepcion'; assert.equal(n(), 1, 'recepcion');
mod.filtro='obstetra'; assert.equal(n(), 1, 'obstetra');
// Área + período juntos
mod.filtro='emergencia'; mod.periodo='mes-pasado'; assert.equal(n(), 1, 'emergencia mes pasado');
mod.periodo='mes'; assert.equal(n(), 0, 'emergencia este mes');
// Fechas a mano mandan sobre el botón de período
mod.filtro='todos'; document.getElementById('desde').value = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1).toISOString().slice(0,10);
assert.equal(n(), 2, 'rango manual');
// Export: separador ;, comillas escapadas, BOM
document.getElementById('desde').value=''; mod.periodo='todo'; mod.descargarExcel();
const csv = global.__blob.texto;
assert.ok(csv.startsWith('﻿"Fecha";"Área"'), 'encabezado');
assert.ok(csv.includes('"Ana; ""A"""'), 'escape de comillas');
assert.equal(csv.trim().split('\r\n').length, 5, 'filas');
// Columnas de aspecto salen de las preguntas, con su valor en la fila
assert.ok(csv.includes('"Cuidado al inyectar";"Respeto a tu privacidad"'), 'columnas dinámicas');
assert.ok(csv.includes('"No respetaron mi privacidad"'), 'motivo con texto de la pregunta');
assert.ok(descargado.endsWith('.csv'), 'nombre archivo');
console.log('TODAS LAS PRUEBAS OK');

// Celulares repetidos: mismo celular (huella) con varias encuestas se agrupa y marca las seguidas
{
  const src2 = readFileSync('admin.html','utf8').split('<script>')[1].split('</script>')[0];
  const pintado = {};
  const el2 = id => ({ ...el(id), set innerHTML(v){ pintado[id] = v; } });
  global.document = { ...global.document, getElementById: el2, createElement: () => { let t = ''; return { set textContent(v){ t = String(v); }, get innerHTML(){ return t; } }; } };
  const m2 = new Function(src2 + '; return {render, set todas(v){todas=v}, set periodo(v){periodo=v}};')();
  const min = n => new Date(Date.now() - n * 60000).toISOString();
  const base = {servicio:'emergencia', rol:'enfermeria', calificacion:5, motivos:[], adjuntos:[]};
  m2.todas = [
    {...base, creado_en:min(5), huella:'aaaa1111', aparato:'x', personal_nombre:'Luz', nombre:'Ana', celular:'987654321'},
    {...base, creado_en:min(10), huella:'aaaa1111', aparato:'y', personal_nombre:'Luz', nombre:'Bea', repetida:true},
    {...base, creado_en:min(600), huella:'aaaa1111', aparato:'x', personal_nombre:'Luz', nombre:'Ana'},
    {...base, creado_en:min(20), huella:'bbbb2222', aparato:'z', personal_nombre:'Mia', nombre:'Solo'},
    {...base, creado_en:min(30), personal_nombre:'Vieja sin huella'},
  ];
  m2.periodo = 'todo'; m2.render();
  const h = pintado.repetidos;
  assert.ok(h.includes('3 encuestas') && h.includes('1 seguidas'), 'agrupa y marca seguidas');
  assert.ok(h.includes('Luz (3)') && h.includes('Ana, Bea') && h.includes('987654321') && h.includes('2 navegadores'), 'detalle del grupo');
  assert.ok(!h.includes('Mia') && !h.includes('Vieja'), 'no lista celulares con una sola encuesta');
  assert.ok(h.includes('1 no contadas'), 'muestra cuántas no cuentan');
  assert.ok(pintado.kpis.includes('<div class="valor">4</div><div class="nombre">Respuestas</div>'), 'la repetida no entra a los KPIs');
  console.log('REPETIDOS OK');
}
