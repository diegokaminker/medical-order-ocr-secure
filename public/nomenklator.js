// Nomenklator Management JavaScript
const API_BASE = '/api/nomenklator';

// Global variables
let currentEntries = [];
let currentStats = null;
let currentPage = 1;
let entriesPerPage = 20;
let totalPages = 1;
let isEditing = false;
let editingCodigo = null;

// DOM elements
const statsContainer = document.getElementById('statsContainer');
const searchInput = document.getElementById('searchInput');
const entriesContainer = document.getElementById('entriesContainer');
const paginationContainer = document.getElementById('paginationContainer');
const messageContainer = document.getElementById('messageContainer');
const entryModal = document.getElementById('entryModal');
const entryForm = document.getElementById('entryForm');
const modalTitle = document.getElementById('modalTitle');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadStats();
    loadEntries();
});

// Event Listeners
function initializeEventListeners() {
    // Search
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Modal
    document.getElementById('addEntryBtn').addEventListener('click', () => openModal());
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Form submission
    entryForm.addEventListener('submit', handleFormSubmit);
    
    // Export buttons
    document.getElementById('exportJsonBtn').addEventListener('click', () => exportData('json'));
    document.getElementById('exportCsvBtn').addEventListener('click', () => exportData('csv'));
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadStats();
        loadEntries();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === entryModal) {
            closeModal();
        }
    });
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const result = await response.json();
        
        if (result.success) {
            currentStats = result.data;
            displayStats();
        } else {
            showMessage('Error loading statistics: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error loading statistics: ' + error.message, 'error');
    }
}

// Display statistics
function displayStats() {
    if (!currentStats) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${currentStats.totalEntries}</div>
            <div class="stat-label">Total Entradas</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${currentStats.entriesWithSynonyms}</div>
            <div class="stat-label">Con Sinónimos</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${currentStats.entriesWithoutSynonyms}</div>
            <div class="stat-label">Sin Sinónimos</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${currentStats.nextCode}</div>
            <div class="stat-label">Próximo Código</div>
        </div>
    `;
}

// Load entries
async function loadEntries(searchTerm = '') {
    try {
        const url = searchTerm ? `${API_BASE}?search=${encodeURIComponent(searchTerm)}` : API_BASE;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            currentEntries = result.data;
            totalPages = Math.ceil(currentEntries.length / entriesPerPage);
            currentPage = 1;
            displayEntries();
            displayPagination();
        } else {
            showMessage('Error loading entries: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error loading entries: ' + error.message, 'error');
    }
}

// Display entries
function displayEntries() {
    if (currentEntries.length === 0) {
        entriesContainer.innerHTML = '<div class="loading">No se encontraron entradas</div>';
        return;
    }
    
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const pageEntries = currentEntries.slice(startIndex, endIndex);
    
    entriesContainer.innerHTML = pageEntries.map(entry => `
        <div class="entry-row">
            <div class="entry-code">${entry.CODIGO}</div>
            <div class="entry-description">${entry.DESCRIPCION}</div>
            <div class="entry-synonym">${entry.SINONIMO === '-' ? '-' : entry.SINONIMO}</div>
            <div class="entry-atajo">${entry.ATAJO}</div>
            <div class="entry-actions">
                <button class="btn-edit" onclick="editEntry(${entry.CODIGO})">✏️</button>
                <button class="btn-delete" onclick="deleteEntry(${entry.CODIGO})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Display pagination
function displayPagination() {
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">« Anterior</button>`;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const className = i === currentPage ? 'current-page' : '';
        paginationHTML += `<button class="${className}" onclick="changePage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span>...</span>`;
        }
        paginationHTML += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Siguiente »</button>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayEntries();
    displayPagination();
}

// Handle search
function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    loadEntries(searchTerm);
}

// Open modal for adding/editing
function openModal(codigo = null) {
    isEditing = codigo !== null;
    editingCodigo = codigo;
    
    modalTitle.textContent = isEditing ? 'Editar Entrada' : 'Nueva Entrada';
    entryForm.reset();
    
    if (isEditing) {
        // Load existing entry data
        const entry = currentEntries.find(e => e.CODIGO == codigo);
        if (entry) {
            document.getElementById('codigo').value = entry.CODIGO;
            document.getElementById('descripcion').value = entry.DESCRIPCION;
            document.getElementById('sinonimo').value = entry.SINONIMO === '-' ? '' : entry.SINONIMO;
            document.getElementById('atajo').value = entry.ATAJO;
        }
    } else {
        // Set next code for new entry
        if (currentStats) {
            document.getElementById('codigo').value = currentStats.nextCode;
        }
    }
    
    entryModal.style.display = 'block';
}

// Close modal
function closeModal() {
    entryModal.style.display = 'none';
    isEditing = false;
    editingCodigo = null;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(entryForm);
    const entryData = {
        CODIGO: parseInt(formData.get('codigo')),
        DESCRIPCION: formData.get('descripcion'),
        SINONIMO: formData.get('sinonimo'),
        ATAJO: parseInt(formData.get('atajo'))
    };
    
    try {
        let response;
        if (isEditing) {
            response = await fetch(`${API_BASE}/${editingCodigo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entryData)
            });
        } else {
            response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entryData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(
                isEditing ? 'Entrada actualizada correctamente' : 'Entrada creada correctamente', 
                'success'
            );
            closeModal();
            loadStats();
            loadEntries();
        } else {
            showMessage('Error: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Edit entry
function editEntry(codigo) {
    openModal(codigo);
}

// Delete entry
async function deleteEntry(codigo) {
    if (!confirm(`¿Está seguro de que desea eliminar la entrada con código ${codigo}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${codigo}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Entrada eliminada correctamente', 'success');
            loadStats();
            loadEntries();
        } else {
            showMessage('Error: ' + result.error, 'error');
        }
    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
    }
}

// Export data
function exportData(format) {
    window.open(`${API_BASE}/export/${format}`, '_blank');
}

// Show message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    
    messageContainer.innerHTML = '';
    messageContainer.appendChild(messageDiv);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}
