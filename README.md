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

### API Keys
Las claves de la API de Gemini están configuradas en el código:
- `VITE_GEMINI_API_KEY`: AIzaSyBiZNn_im3eUN1bDg0g7xAfxGF50cCiLA8
- `VITE_GEMINI_MODEL`: gemini-2.0-flash-001

## 🚀 Despliegue en GitHub Pages

1. **Crear repositorio en GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/medical-order-ocr.git
   git push -u origin main
   ```

2. **Habilitar GitHub Pages**
   - Ve a Settings > Pages en tu repositorio
   - Selecciona "Deploy from a branch"
   - Elige la rama "main" y carpeta "/ (root)"
   - Guarda los cambios

3. **Acceder a la aplicación**
   - La aplicación estará disponible en: `https://tu-usuario.github.io/medical-order-ocr`

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
