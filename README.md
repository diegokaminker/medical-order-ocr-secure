# 🏥 Extractor de Órdenes Médicas - OCR

Una solución web para extraer información de órdenes médicas utilizando OCR con IA (Google Gemini).

## 🚀 Características

- **Autenticación simple**: Sistema de login con usuario y contraseña
- **Carga de archivos**: Soporte para PDF, PNG y JPG
- **OCR con IA**: Utiliza Google Gemini 2.0 Flash para extracción de texto
- **Interfaz en español**: Completamente localizada
- **Descarga JSON**: Exporta los datos extraídos en formato JSON
- **Responsive**: Funciona en dispositivos móviles y desktop
- **Disclaimer PHI**: Advertencia sobre no usar datos reales de pacientes

## 📋 Información Extraída

El sistema extrae los siguientes campos de las órdenes médicas:

- Número de Orden
- Fecha de Orden
- Nombre del Clínico
- Tipo de ID del Clínico (nacional, provincial, gpf)
- Número de ID del Clínico
- Diagnóstico
- Notas
- Servicios Solicitados

## 🔧 Configuración

### Credenciales de Acceso
- **Usuario**: admin
- **Contraseña**: ocr2024



## 🚀 Despliegue en Vercel (Recomendado)

### Opción 1: Despliegue desde GitHub (Recomendado)

1. **Subir código a GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel backend for secure API key handling"
   git push origin main
   ```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con tu cuenta de GitHub
   - Haz clic en "New Project"
   - Importa tu repositorio `bpo_ocr_test`
   - Vercel detectará automáticamente la configuración

3. **Configurar Variables de Entorno**
   - En el dashboard de Vercel, ve a tu proyecto
   - Ve a Settings > Environment Variables
   - Agrega:
     - `GEMINI_API_KEY`: `AIzaSyBiZNn_im3eUN1bDg0g7xAfxGF50cCiLA8`
     - `GEMINI_MODEL`: `gemini-2.0-flash-001`

4. **Desplegar**
   - Vercel desplegará automáticamente
   - Tu app estará disponible en: `https://tu-proyecto.vercel.app`

### Opción 2: Despliegue Local con Vercel CLI

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Iniciar sesión**
   ```bash
   vercel login
   ```

3. **Desplegar**
   ```bash
   vercel
   ```

4. **Configurar variables de entorno**
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add GEMINI_MODEL
   ```

## 🔒 Seguridad Mejorada

- ✅ **API Key Seguro**: Almacenado en variables de entorno de Vercel
- ✅ **Backend Proxy**: El frontend no tiene acceso directo a la API key
- ✅ **CORS Configurado**: Solo tu dominio puede hacer requests
- ✅ **Rate Limiting**: Vercel incluye protección contra abuso

## 📁 Estructura del Proyecto

```
medical-order-ocr/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
└── README.md           # Documentación
```

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Esta aplicación está diseñada únicamente para fines de demostración. 

- **NO envíe datos reales de pacientes**
- **NO use información de salud protegida (PHI)**
- Use únicamente documentos de prueba o datos ficticios

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura de la aplicación
- **CSS3**: Estilos y diseño responsive
- **JavaScript ES6+**: Lógica de la aplicación
- **Google Gemini API**: OCR y procesamiento de IA
- **GitHub Pages**: Hosting estático

## 📱 Compatibilidad

- ✅ Chrome (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móviles

## 🔄 Flujo de Trabajo

1. **Login**: Ingrese con las credenciales proporcionadas
2. **Carga**: Arrastre y suelte o seleccione un archivo de orden médica
3. **Procesamiento**: La IA extrae automáticamente la información
4. **Revisión**: Revise y edite los datos extraídos si es necesario
5. **Descarga**: Exporte los datos en formato JSON

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación, contacte al equipo de desarrollo.

---

**Desarrollado con ❤️ para la automatización de procesos médicos**
