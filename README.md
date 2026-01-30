# DCANP GROUP - Cloudflare Pages + Apps Script + Google Sheets

## 1) Qué hay aquí
- `index.html`: tu frontend completo
- `functions/api/gas.js`: proxy server-side para llamar a tu Web App de Apps Script sin problemas de CORS

El frontend llama a **/api/gas** y Cloudflare lo reenvía a Apps Script.

## 2) Variables de entorno en Cloudflare Pages
En Cloudflare Pages → tu proyecto → Settings → Environment variables:

- `GAS_WEBAPP_URL` = `https://script.google.com/macros/s/XXXXXXXXXXXX/exec`
- `DCANP_SECRET` = (el mismo valor que guardaste en Apps Script como Script Property `DCANP_SECRET`)

> Si no usás secreto, podés dejar `DCANP_SECRET` vacío y también borrar/ignorar la validación del secret en Apps Script.

## 3) Deploy de Apps Script (muy importante)
Deploy → New deployment → Web app
- Execute as: **Me**
- Who has access: **Anyone**
Copiá la URL que termina en **/exec** y pegala como `GAS_WEBAPP_URL`.

## 4) Publicar con GitHub
1. Creá un repo y subí estos archivos.
2. En Cloudflare Pages → Create project → Conectar GitHub → elegir repo
3. Build settings:
   - Framework preset: **None**
   - Build command: *(vacío)*
   - Output directory: `/` (root)

Listo.

## 5) Endpoint
- Frontend: `/`
- API proxy: `/api/gas` (POST JSON: `{ fn: "nombreFuncion", args: [...] }`)
