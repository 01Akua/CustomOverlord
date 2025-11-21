# Custom Overlord – Sistema Inteligente de Asesoramiento

Proyecto web estático que permite seleccionar marca, modelo y año de moto para visualizar repuestos compatibles, accesorios, precios, detalles técnicos, productos sugeridos y comparaciones básicas.

## Arquitectura

- `index.html`: SPA con secciones Inicio, Buscador, Resultados y Detalle
- `assets/css/style.css`: Estilos adicionales (Tailwind vía CDN)
- `assets/js/app.js`: Orquestación, estado, eventos, tema y captura
- `assets/js/ui.js`: Renderizado de UI y componentes
- `assets/js/compatibility.js`: Lógica de compatibilidad y utilidades
- `data/motos.json`: Datos de marcas, modelos y años
- `data/parts.json`: Datos de repuestos y accesorios

## Stack y librerías

- HTML5, CSS3, TailwindCSS (Play CDN)
- JavaScript (módulos nativos)
- GSAP (animaciones) + AOS (scroll)
- Íconos: Lucide
- Capturas: html2canvas

## Ejecución local

1. Clona el repositorio
2. Abre `index.html` en un servidor estático (por ejemplo, `python -m http.server`)
3. Navega a `http://localhost:8000`

## Despliegue en GitHub Pages

1. Sube todo el proyecto a GitHub en la rama `main`
2. Ve a `Settings` → `Pages`
3. En `Build and deployment`, selecciona `Source: Deploy from a branch`
4. Elige `Branch: main` y `Folder: / (root)`
5. Guarda. La URL pública se generará automáticamente

## Modo oscuro / claro

- Toggle en el header
- Preferencia persistida en `localStorage` (`co-theme`)

## Capturas de pantalla automáticas

- Botón `Capturar Screenshot` en el Hero
- Genera un PNG del estado actual usando `html2canvas`

## Datos simulados

Los JSON están en `data/`. Puedes ampliar las entradas de marcas, modelos y partes manteniendo el esquema.

## Créditos

Diseño y desarrollo. Animaciones con GSAP y AOS. Íconos Lucide.