/**
 * Progress Manager for Flash Cards App
 * Handles export/import of learning progress using local files
 */

class ProgressManager {
    constructor() {
        this.storageKey = 'flashcard-progress';
        this.initializeUI();
    }

    initializeUI() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Export progress button
        const exportBtn = document.getElementById('exportProgressBtn');
        const exportBtnModal = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportProgress());
        }
        if (exportBtnModal) {
            exportBtnModal.addEventListener('click', () => this.exportProgress());
        }

        // Import progress button
        const importBtn = document.getElementById('importProgressBtn');
        const importBtnModal = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.triggerImport());
        }
        if (importBtnModal) {
            importBtnModal.addEventListener('click', () => this.triggerImport('modal'));
        }

        // File input handlers
        const fileInput = document.getElementById('importFileInput');
        const fileInputModal = document.getElementById('importFileInputModal');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }
        if (fileInputModal) {
            fileInputModal.addEventListener('change', (e) => this.handleFileImport(e));
        }
    }

    saveProgress(progressData) {
        try {
            const dataToSave = {
                ...progressData,
                timestamp: Date.now(),
                version: '2.0.0'
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            console.log('💾 Progress saved to localStorage');
            return true;
        } catch (error) {
            console.error('❌ Error saving progress:', error);
            return false;
        }
    }

    loadProgress() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const progress = JSON.parse(savedData);
                console.log('✅ Progress loaded from localStorage');
                return progress;
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading progress:', error);
            return null;
        }
    }

    exportProgress() {
        try {
            const progress = this.loadProgress();
            if (!progress) {
                alert('No progress data found to export.');
                return;
            }

            const exportData = {
                appName: 'Language Flash Cards',
                exportDate: new Date().toISOString(),
                version: '2.0.0',
                progress: progress
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flashcard-progress-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Progress exported successfully');
            alert('Progress exported successfully!');
        } catch (error) {
            console.error('❌ Error exporting progress:', error);
            alert('Failed to export progress: ' + error.message);
        }
    }

    triggerImport(source = 'main') {
        const fileInput = source === 'modal' ? 
            document.getElementById('importFileInputModal') : 
            document.getElementById('importFileInput');
        
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Validate import data
                if (!this.validateImportData(importData)) {
                    alert('Invalid progress file format.');
                    return;
                }

                // Confirm import
                const confirmed = confirm(
                    'Are you sure you want to import this progress? This will replace your current progress.'
                );
                
                if (confirmed) {
                    this.importProgress(importData.progress);
                }
            } catch (error) {
                console.error('❌ Error importing progress:', error);
                alert('Failed to import progress: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    validateImportData(data) {
        // Check if data has required structure
        return data && 
               data.appName === 'Language Flash Cards' &&
               data.progress &&
               typeof data.progress === 'object';
    }

    importProgress(progressData) {
        try {
            // Save the imported progress
            this.saveProgress(progressData);
            
            // Notify the app to reload
            if (window.flashCardApp) {
                window.flashCardApp.loadProgressFromStorage();
                window.flashCardApp.render();
            }
            
            // Close modal if open
            const modal = document.getElementById('accountSettings');
            if (modal) {
                modal.style.display = 'none';
            }
            
            console.log('✅ Progress imported successfully');
            alert('Progress imported successfully!');
        } catch (error) {
            console.error('❌ Error importing progress:', error);
            alert('Failed to import progress: ' + error.message);
        }
    }

    clearProgress() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Progress cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing progress:', error);
            return false;
        }
    }

    // Utility methods for app compatibility
    getCurrentUser() {
        return 'local_user'; // Always return a default user
    }

    isLoggedIn() {
        return true; // Always consider user as "logged in" for compatibility
    }
}

// Initialize progress manager
let progressManager;
document.addEventListener('DOMContentLoaded', () => {
    progressManager = new ProgressManager();
    
    // Make it globally available for compatibility
    window.authManager = progressManager;
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressManager;
}
