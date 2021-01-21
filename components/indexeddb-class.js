class storedLibraries {
    constructor() {
        this.DB_NAME = 'recording-template';
        this.DB_VERSION = 1;
        this.DB_STORE_NAME = 'library';
        this.db = null;
        this.libraries = [];

        if (!('indexedDB' in window)) {
            console.log('This browser doesn\'t support IndexedDB');
            return;
        }
    }
    
    loadLibraries(libraryUi) {
        this.openDb().then((result) => {
            this.getObjectStore().then((result) => {
                for(const res of result) {
                    this.libraries.push(new recordingsTemplate(res));
                }
                libraryUi.loadSavedLibrariesUi(this.libraries, this);
            });
        }).catch(console.error);
    }
    
    async getLibrary(name){
        for(const library of this.libraries) {
        console.log(library.rootDirName);
        console.log(name);
            if(library.rootDirName == name) {
                return library
            }
            return false;
        }
    }

    async openDb() {
        var _self = this;
        const prom = new Promise((resolve, reject) => {
            var request = indexedDB.open(_self.DB_NAME, _self.DB_VERSION);
            
            request.onsuccess = (event) => {
                console.log("openDb:");
                _self.db = request.result;
                resolve(request.result);
            }
            request.onerror = (event) => {
                console.error("openDb:", event.target.errorCode);
                reject(event);
            }
            
            request.onupgradeneeded = (event) => {
                console.log("openDb.onupgradeneeded");
                _self.db = request.result;
                var store = event.currentTarget.result.createObjectStore(_self.DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                var transaction = event.target.transaction;
                
                transaction.oncomplete = (event) => {
                    resolve(store);
                }
            }
        });
        return prom;
    }
    
    async getObjectStore() {
        var _self = this;
        const prom = new Promise((resolve, reject) => {
            var transaction = _self.db.transaction(["library"], "readwrite");
            var objectStore = transaction.objectStore("library");
            var request = objectStore.getAll();
            
            request.onerror = (event) => {
                // Handle errors!
                reject(event);
            };
            request.onsuccess = (event) => {
                resolve(request.result);
            };
        });
        return prom;
    }
    
    async saveLibrary(template) {
        var _self = this;
        const prom = new Promise((resolve, reject) => {
            var transaction = _self.db.transaction(["library"], "readwrite");
            
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                console.log("All done!");
            };

            transaction.onerror = function(event) {
                // Don't forget to handle errors!
            };

            var objectStore = transaction.objectStore("library");
            var request = objectStore.add(template);
            request.onsuccess = function(event) {
                // event.target.result
            };
        });
        return prom;
    }
}



