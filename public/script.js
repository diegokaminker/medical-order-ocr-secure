// Configuración de la API - Ahora usando servidor local
const API_ENDPOINT = '/api/process-ocr';

// Credenciales de autenticación (en un entorno real, esto debería estar en el servidor)
const VALID_CREDENTIALS = {
    username: 'admin',
    password: 'ocr2024'
};

// Variables globales
let currentFile = null;
let extractedData = null;

// Elementos del DOM
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const processBtn = document.getElementById('processBtn');
const resultsSection = document.getElementById('resultsSection');
const loadingSection = document.getElementById('loadingSection');
const addServiceBtn = document.getElementById('addServiceBtn');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');
const processNewBtn = document.getElementById('processNewBtn');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkAuthStatus();
});

// Event Listeners
function initializeEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Processing
    processBtn.addEventListener('click', processFile);
    processNewBtn.addEventListener('click', resetForm);
    
    // Services management
    addServiceBtn.addEventListener('click', addServiceField);
    
    // Download
    downloadJsonBtn.addEventListener('click', downloadJSON);
}

// Autenticación
function checkAuthStatus() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
        showMainScreen();
    } else {
        showLoginScreen();
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
        localStorage.setItem('isAuthenticated', 'true');
        showMainScreen();
    } else {
        alert('Credenciales incorrectas. Intente nuevamente.');
    }
}

function handleLogout() {
    localStorage.removeItem('isAuthenticated');
    showLoginScreen();
    resetForm();
}

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
}

function showMainScreen() {
    loginScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
}

// Manejo de archivos
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no soportado. Use PDF, PNG o JPG.');
        return;
    }
    
    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Máximo 10MB.');
        return;
    }
    
    currentFile = file;
    
    // Mostrar información del archivo
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    
    // Ocultar resultados anteriores
    resultsSection.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Procesamiento con Gemini
async function processFile() {
    if (!currentFile) {
        alert('Por favor seleccione un archivo primero.');
        return;
    }
    
    showLoading();
    
    try {
        // Convertir archivo a base64
        const base64 = await fileToBase64(currentFile);
        
        // Llamar a la API de Vercel (que internamente usa Gemini)
        extractedData = await callVercelAPI(base64, currentFile.type);
        
        // Mostrar los datos extraídos
        displayExtractedData(extractedData);
        
        hideLoading();
        showResults();
        
    } catch (error) {
        console.error('Error procesando archivo:', error);
        alert('Error al procesar el archivo. Verifique su conexión e intente nuevamente.');
        hideLoading();
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function callVercelAPI(base64Data, mimeType) {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            base64Data: base64Data,
            mimeType: mimeType
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de API: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Error procesando el archivo');
    }

    return data.data; // Return parsed data directly
}

function parseExtractedData(text) {
    // Esta función parsea la respuesta de Gemini y extrae los datos estructurados
    // En un caso real, esto sería más sofisticado
    const data = {
        orderNumber: '',
        orderDate: '',
        clinicianName: '',
        clinicianIdType: '',
        clinicianIdNumber: '',
        diagnosis: '',
        notes: '',
        requestedServices: []
    };

    // Buscar patrones en el texto (esto es una implementación básica)
    const lines = text.split('\n');
    
    for (let line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('order number') || lowerLine.includes('número de orden')) {
            data.orderNumber = extractValue(line);
        } else if (lowerLine.includes('order date') || lowerLine.includes('fecha de orden')) {
            data.orderDate = extractValue(line);
        } else if (lowerLine.includes('clinician name') || lowerLine.includes('nombre del clínico')) {
            data.clinicianName = extractValue(line);
        } else if (lowerLine.includes('clinician id type') || lowerLine.includes('tipo de id')) {
            data.clinicianIdType = extractValue(line);
        } else if (lowerLine.includes('clinician id number') || lowerLine.includes('número de id')) {
            data.clinicianIdNumber = extractValue(line);
        } else if (lowerLine.includes('diagnosis') || lowerLine.includes('diagnóstico')) {
            data.diagnosis = extractValue(line);
        } else if (lowerLine.includes('notes') || lowerLine.includes('notas')) {
            data.notes = extractValue(line);
        } else if (lowerLine.includes('requested services') || lowerLine.includes('servicios solicitados')) {
            // Para servicios, buscar múltiples líneas
            const serviceLines = lines.slice(lines.indexOf(line) + 1);
            for (let serviceLine of serviceLines) {
                if (serviceLine.trim() && !serviceLine.toLowerCase().includes(':')) {
                    data.requestedServices.push(serviceLine.trim());
                }
            }
        }
    }

    return data;
}

function extractValue(line) {
    // Extraer valor después de los dos puntos
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
        return line.substring(colonIndex + 1).trim();
    }
    return '';
}

function displayExtractedData(data) {
    document.getElementById('orderNumber').value = data.orderNumber;
    document.getElementById('orderDate').value = data.orderDate;
    document.getElementById('clinicianName').value = data.clinicianName;
    document.getElementById('clinicianIdType').value = data.clinicianIdType;
    document.getElementById('clinicianIdNumber').value = data.clinicianIdNumber;
    document.getElementById('diagnosis').value = data.diagnosis;
    document.getElementById('notes').value = data.notes;
    
    // Mostrar archivo original en la vista de comparación
    displayFilePreview();
    
    // Limpiar servicios existentes
    const servicesContainer = document.getElementById('requestedServices');
    servicesContainer.innerHTML = '';
    
    // Mostrar servicios con matches del nomenklator
    if (data.matchedServices && data.matchedServices.length > 0) {
        data.matchedServices.forEach((serviceMatch, index) => {
            displayMatchedService(serviceMatch, index);
        });
        // Actualizar estadísticas de mapeo
        updateMappingStats(data.matchedServices);
    } else if (data.requestedServices && data.requestedServices.length > 0) {
        // Fallback si no hay matchedServices
        data.requestedServices.forEach(service => {
            addServiceField(service);
        });
        // Actualizar estadísticas con servicios sin mapeo
        updateMappingStats([]);
    } else {
        addServiceField();
        // Sin servicios
        updateMappingStats([]);
    }
}

function displayFilePreview() {
    if (currentFile) {
        const fileImage = document.getElementById('fileImage');
        const fileDisplay = document.getElementById('fileDisplay');
        
        if (currentFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                fileImage.src = e.target.result;
                fileImage.style.display = 'block';
                // Clear any PDF content
                fileDisplay.innerHTML = '';
                fileDisplay.appendChild(fileImage);
            };
            reader.readAsDataURL(currentFile);
        } else if (currentFile.type === 'application/pdf') {
            // Para PDFs, mostrar un mensaje sin romper la estructura
            fileImage.style.display = 'none';
            fileDisplay.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📄</div>
                    <p><strong>Archivo PDF:</strong> ${currentFile.name}</p>
                    <p>Los datos han sido extraídos del PDF</p>
                </div>
            `;
        }
    }
}

function displayMatchedService(serviceMatch, index) {
    const servicesContainer = document.getElementById('requestedServices');
    const serviceContainer = document.createElement('div');
    serviceContainer.className = 'service-match-container';
    
    let statusClass = serviceMatch.hasMatch ? 'matched' : 'no-match';
    let statusText = serviceMatch.hasMatch ? '✓ Coincidencia' : '⚠ Sin coincidencia';
    
    let matchDetails = '';
    if (serviceMatch.hasMatch && serviceMatch.bestMatch) {
        const match = serviceMatch.bestMatch;
        
        matchDetails = `
            <div class="service-match-details">
                <div class="service-code">Código: ${match.codigo}</div>
                <div class="service-description">${match.descripcion}</div>
                ${match.sinonimo ? `<div class="service-synonym">Sinónimo: ${match.sinonimo}</div>` : ''}
            </div>
        `;
    } else {
        matchDetails = `
            <div class="service-no-match">
                No se encontró coincidencia en el nomenclador
            </div>
        `;
    }
    
    serviceContainer.innerHTML = `
        <div class="service-match-header">
            <div class="service-original">${serviceMatch.originalService}</div>
            <div class="service-match-status ${statusClass}">${statusText}</div>
        </div>
        ${matchDetails}
    `;
    
    servicesContainer.appendChild(serviceContainer);
}

// Update mapping statistics
function updateMappingStats(matchedServices) {
    const totalServices = matchedServices.length;
    const mappedServices = matchedServices.filter(service => service.hasMatch).length;
    const mappingPercentage = totalServices > 0 ? Math.round((mappedServices / totalServices) * 100) : 0;
    
    // Update the statistics display
    document.getElementById('totalServices').textContent = totalServices;
    document.getElementById('mappedServices').textContent = mappedServices;
    document.getElementById('mappingPercentage').textContent = mappingPercentage + '%';
}

function addServiceField(value = '') {
    const servicesContainer = document.getElementById('requestedServices');
    const serviceItem = document.createElement('div');
    serviceItem.className = 'service-item';
    
    serviceItem.innerHTML = `
        <input type="text" placeholder="Servicio" class="service-input" value="${value}">
        <button type="button" class="btn-remove-service">❌</button>
    `;
    
    // Event listener para eliminar servicio
    const removeBtn = serviceItem.querySelector('.btn-remove-service');
    removeBtn.addEventListener('click', () => {
        serviceItem.remove();
    });
    
    servicesContainer.appendChild(serviceItem);
}

// UI Helpers
function showLoading() {
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    fileInfo.style.display = 'none';
}

function hideLoading() {
    loadingSection.style.display = 'none';
}

function showResults() {
    resultsSection.style.display = 'block';
    // Ocultar la sección de carga para maximizar el espacio
    document.getElementById('uploadSection').style.display = 'none';
}

function resetForm() {
    currentFile = null;
    extractedData = null;
    
    // Limpiar formulario
    fileInput.value = '';
    fileInfo.style.display = 'none';
    resultsSection.style.display = 'none';
    
    // Mostrar sección de carga nuevamente
    document.getElementById('uploadSection').style.display = 'block';
    
    // Limpiar datos extraídos
    document.getElementById('orderNumber').value = '';
    document.getElementById('orderDate').value = '';
    document.getElementById('clinicianName').value = '';
    document.getElementById('clinicianIdType').value = '';
    document.getElementById('clinicianIdNumber').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('notes').value = '';
    
    // Limpiar servicios
    const servicesContainer = document.getElementById('requestedServices');
    servicesContainer.innerHTML = '';
    addServiceField();
}

// Descarga JSON
function downloadJSON() {
    if (!extractedData) {
        alert('No hay datos para descargar. Procese un archivo primero.');
        return;
    }
    
    // Recopilar datos del formulario
    const services = Array.from(document.querySelectorAll('.service-input'))
        .map(input => input.value.trim())
        .filter(value => value !== '');
    
    const jsonData = {
        order: {
            orderNumber: document.getElementById('orderNumber').value,
            orderDate: document.getElementById('orderDate').value,
            clinicianName: document.getElementById('clinicianName').value,
            clinicianIdType: document.getElementById('clinicianIdType').value,
            clinicianIdNumber: document.getElementById('clinicianIdNumber').value,
            diagnosis: document.getElementById('diagnosis').value,
            notes: document.getElementById('notes').value,
            requestedServices: services
        }
    };
    
    // Crear y descargar archivo
    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `orden_medica_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
