# Encuesta de Atención — Clínica Versalles

Encuesta anónima de 30 segundos para que pacientes califiquen la atención en
Recepción y Emergencia, con foto y nombre de quien los atendió.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La encuesta que ve el paciente (abrir desde QR o tablet) |
| `admin.html` | Panel de resultados (protegido con clave) |
| `logo-versalles.png` | Logo oficial (debe estar junto a los HTML) |
| `test.sh` | Chequeo rápido del backend (`sh test.sh`) |

## Backend

Supabase, proyecto **versalles-web** (`cvijxlgdshfwqszbqgkr`). Tablas nuevas,
no toca nada existente:

- `encuesta_personal` — recepcionistas/personal calificable (nombre, servicio, foto_url, activo, orden)
- `encuesta_respuestas` — respuestas anónimas (solo se pueden INSERTAR desde la web; leerlas requiere la clave vía función `encuesta_admin`)

## Clave del panel admin

Clave inicial: `versalles2026`. **Cambiarla** en Supabase → SQL Editor:

```sql
update privado.encuesta_config set clave = 'TU_NUEVA_CLAVE';
```

## Cargar el personal real

En Supabase → Table Editor → `encuesta_personal`:

1. Borrar las filas "Ejemplo ...".
2. Agregar una fila por persona: `nombre`, `servicio` (`recepcion` o `emergencia`), `orden`.
3. Fotos: subirlas en Supabase → Storage (crear bucket público `encuesta-fotos`),
   copiar la URL pública y pegarla en `foto_url`. Sin foto, la encuesta muestra
   un círculo con las iniciales (también se ve bien).

Para pausar a alguien (vacaciones, cese): poner `activo = false`.

## QR por servicio

La URL acepta `?s=` para saltar la primera pregunta:

- Recepción: `https://TU-URL/index.html?s=recepcion`
- Emergencia: `https://TU-URL/index.html?s=emergencia`

Generar los QR con cualquier generador cuando esté la URL final.

## Publicar

Es un sitio estático (3 archivos). Sirve Vercel, Cloudflare Pages o Netlify:
arrastrar la carpeta y listo. Mientras tanto se puede probar abriendo
`index.html` directo en el navegador.

## Notas

- Anti-duplicados: el mismo celular no puede responder de nuevo por 4 horas (localStorage).
- La calificación es de 1 a 5 con caritas; si la nota es 1-3 se piden motivos
  (espera, trato, información, seguro/pago, otro) y comentario opcional.
- El panel muestra: KPIs, ranking por persona, motivos de queja y comentarios,
  con filtros por servicio y últimos 7 días.
