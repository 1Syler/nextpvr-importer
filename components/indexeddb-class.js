class savedLibraries {
    constructor() {
        this.DB_NAME = 'recordingsLibrary';
        this.DB_VERSION = 1;
        this.DB_STORE_NAME = 'library';
        this.db = null;

        if (!('indexedDB' in window)) {
            console.log('This browser doesn\'t support IndexedDB');
            return;
        }
    }

    async openDb() {
        const _self = this;
        const promise = new Promise((resolve, reject) => {
            const request = indexedDB.open(_self.DB_NAME, _self.DB_VERSION);
            request.onsuccess = (event) => {
                _self.db = request.result;
                resolve(request.result);
            }
            request.onerror = (event) => {
                reject(event.target.errorCode);
            }
            
            request.onupgradeneeded = (event) => {
                _self.db = request.result;
                const store = event.currentTarget.result.createObjectStore(_self.DB_STORE_NAME, { keyPath: 'idNum', autoIncrement: false });
                const transaction = event.target.transaction;
                
                transaction.oncomplete = (event) => {
                    resolve(store);
                }
            }
        });
        return promise;
    }
    
    async getsavedLibraries() {
        const _self = this;
        const promise = new Promise((resolve, reject) => {
            const transaction = _self.db.transaction([_self.DB_STORE_NAME], "readwrite");
            const library = transaction.objectStore(_self.DB_STORE_NAME);
            const request = library.getAll();
            
            request.onerror = (event) => {
                reject(event.target.errorCode);
            };
            request.onsuccess = (event) => {
                resolve(request.result);
            };
        });
        return promise;
    }
    
    async saveLibrary(library) {
        console.log(library);
        const _self = this;
        const promise = new Promise((resolve, reject) => {
            const transaction = _self.db.transaction([_self.DB_STORE_NAME], "readwrite");
            const objStore = transaction.objectStore(_self.DB_STORE_NAME);
            const request = objStore.add(library);
            
            // Do something when all the data is added to the database.
            transaction.oncomplete = function(event) {
                resolve();
            };

            transaction.onerror = function(event) {
                reject(event.target.error);
            };

            request.onsuccess = function(event) {
                resolve();
            };
        });
        return promise;
    }
}
