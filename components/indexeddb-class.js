//var request = window.indexedDB.open("MyTestDatabase", 3);

var db;
var request = indexedDB.open("MyTestDatabase");
request.onerror = function(event) {
  console.log("Why didn't you allow my web app to use IndexedDB?!");
};
request.onsuccess = function(event) {
  db = event.target.result;
};

db.onerror = function(event) {
  // Generic error handler for all errors targeted at this database's
  // requests!
  console.error("Database error: " + event.target.errorCode);
};

