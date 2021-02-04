class importerTool {
    constructor() {
        // Load the saved Libraries if any
        this.idb = new savedLibraries();                  // A class for using indexedDB for storage
        this.savedLibraries = []                          // An array of saved recordingsLibrary instances
        if(this.loadSavedLibrariesUi() === false) {       // Get saved libraries from indexedDB
            // diplayErrorToUser()
        }
        
        // Set required classes
        this.library = new recordingsLibrary();           // The current recordingsLibrary instance
        this.libraryUi = new recordingsUi();              // Single recordingsUi instance for all requests
        
        // Set optional classes
        this.ffmpeg = null;                               // ffmpegData class if requested by the user
        
        // Set the user input values
        this.userInput = {
            dirSeparator: null,                           // Set the directory path separator \ or /
            fullPath: null,                               // The full path to the opened directory
            libraryName: "test",                          // The user input library name
            dataSourceOpt: null,                          // #0 - None #1 - FFmpeg #2 - iTunes
            filterOption: null,                           // #0 - None #1 - Name   #2 - Name (Year)
            genreOption: null,                            // A selected Genre
            title: null,                                  // A user input title
            subTitle: null,                               // A user input sub title
            dummyDuration: null                           // A user input duration or default 02:00:00
        }
        if(this.getPathSeperator() === false) {           // Get direcory separator depending on user OS
            // diplayErrorToUser()
        }
        
        const _self = this;
        this.filterButton = $('#run-filter');
        $(`#run-filter`).click(function() {
            const filter = $("#custom-filter").val();
            const propName = $("#prop-name").val();
            _self.runCustomFilter(filter, propName, _self.library.directories);
        });
    }
    
    // Called From:  constructor()
    // Function:     Load the users saved libraries and create the UI for opening them
    // Return:       False if an error occured, true if the UI was created
    loadSavedLibrariesUi() {
        this.idb.openDb().then((result) => {
            this.idb.getsavedLibraries().then((libraries) => {
                for(const library of libraries) {
                    this.savedLibraries.push(library);
                }
                this.library.idNum = this.savedLibraries.length;
                
                this.libraryUi.createSavedLibrariesUi(this.savedLibraries);
                return true;
            });
        }).catch((error) => {
            console.error(`[ERROR] Failed to load the saved libraries ${error}`);
            return false;
        });
    }
    
    // Called From:  constructor()
    // Function:     Sets the directory path separation character depending on OS
    // Return:       False if there was an error, true if the directory separator was set
    getPathSeperator() {
        try {
            let userAgent = window.navigator.userAgent,
                platform = window.navigator.platform,
                macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
                windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
                iosPlatforms = ['iPhone', 'iPad', 'iPod'],
                dirSeparator = null;

            if (macosPlatforms.indexOf(platform) !== -1) { /*dirSeparator = "/";*/ }
            else if (iosPlatforms.indexOf(platform) !== -1) { /*dirSeparator = "/";*/ }
            else if (windowsPlatforms.indexOf(platform) !== -1) { dirSeparator = "\\"; }
            else if (/Android/.test(userAgent)) { /*dirSeparator = /*"/";*/ }
            else if (!dirSeparator && /Linux/.test(platform)) { dirSeparator = "/"; }
            else { return false; }
            
            this.userInput.dirSeparator = dirSeparator;
            return true;
            
        }  catch (err) {
            console.error(`[ERROR] Failed to get path separator: ${err}`);
            return false;
        }
    }
    
    // Called From:  constructor() event listner
    // filter        A user input regular expression /[^a-z ]/g
    // propName      The recording property name to filter
    // directories   An array of all the libraries directories
    // Function:     Runs a user replace regex on each on the selected property in the selected folders
    runCustomFilter(filter, propName, directories) {
        // Check that filter and property were input
        if(filter && propName) {
            const stringToRegex = str => {
                // Main regex
                const main = str.match(/\/(.+)\/.*/)[1];
                // Regex options
                const options = str.match(/\/.+\/(.*)/)[1];
                // Compiled regex
                return new RegExp(main, options);
            }
            
            for(const dir of directories) {
                // Only apply the filter to files in selected directories
                if(dir.selected === true) {
                    try {
                        for(const file of dir.files) {
                            // Set the file properties new value
                            let propVal = file.recordingXmlVals[propName].replace(stringToRegex(filter), "");
                            file.recordingXmlVals[propName] = propVal;
                            
                            // Reload the file UI with the change
                            this.libraryUi.createFileUi(file, dir.pathId);
                        }
                        $("#error-message").css("display", "none");
                        
                    } catch(err) {
                        console.error(err);
                        $("#error-message").css("display", "block");
                        $("#error-message").html("The regex filter is invalid!");
                    }
                }
            }
        } else {
            //displayErrorToUser()
            $("#error-message").css("display", "block");
            $("#error-message").html("You need to select a property and input a regex string");
        }
    }
    
    // Called From:  file://browser-nativefs.js - On directory open
    // blobs         An array of file blobs
    // Function:     Creates a library or adds to an existing library
    async createLibrary(blobs) {
        // Set the user input
        const inputSuccess = this.setUserInput();
        // Disable all inputs whilst creating the library
        this.setButtonState(true);
        
        // If all the user input is valid add the recording to the library
        if(inputSuccess === true) {
            // Set the progress counters
            let recCount = 0;
            let numRecs = blobs.length;
            // If the user has selected to run FFmpeg create progress UI and load FFmpeg
            if(this.userInput.dataSourceOpt == 1) {
                $("#progress-indicator").css("display", "block");
                $(".progress-bar-title").html(`<span id="file-progress">FFmpeg Loading...</span>`);
                $("#progress").css("width", Math.floor(100 / numRecs * recCount) + "%");
                if(this.ffmpeg == null) {
                    this.ffmpeg = new ffmpegData();
                    await this.ffmpeg.loadFfmpeg();
                }
            }
            
            // Add each recording to the library
            for(const blob of blobs) {
                // Create directory and file instances for the recording and return an object with recording data
                const recordingData = await this.library.addRecording(blob, this.userInput, this.libraryNum);
                
                // Get details from a data source if selected
                if(this.userInput.dataSourceOpt == 1) {
                    // Check if it is a video file
                    if(blob.type.startsWith('video/') || this.library.checkMimeTypeStr(blob.name)) {
                        // Set the progress indicator for the current file
                        $(".progress-bar-title").html(`FFmpeg checking file: <span id="file-progress">\
                        ${this.library.recordings[recCount].recordingXmlVals.name}</span>`);
                        
                        // Get the recording data from FFmpeg
                        await this.ffmpeg.runFfmpeg(this.library.getRecording(blob.webkitRelativePath), blob);
                        recCount++;
                    } else {
                        // Not a valid recording to reduce the recordings count
                        numRecs--;
                    }
                } else if(this.userInput.dataSourceOpt == 2) {
                    //iTunes.func(blobs);
                }
                
                // If the recording is a valid file type create the UI
                if(recordingData !== false) {
                    // If the directory UI doesn't exist create it
                    if(recordingData.newDir === true) {
                        await this.libraryUi.createDirUi(recordingData.directory);
                    }
                    
                    // If this is not the first run and a file is being added to an existing directory
                    // recreate the directory order which is sorted when the file is added to the directory
                    if(recordingData.directory.firstRun === false) {
                        $(`#user-output .panel #${recordingData.path}-files`).html("");
                        for(const file of recordingData.directory.files) {
                            this.libraryUi.createFileUi(file, recordingData.path);
                        }
                    } else {
                        this.libraryUi.createFileUi(recordingData.file, recordingData.path);
                    }
                }
            }
            // Reset the progress bar if set
            $("#progress-indicator").css("display", "none");
            $("#progress").css("width", "0%");
            
            // Set the first run status for all the directories currently in the library
            this.setFirstRunStatus(this.library.directories);
            
            // ADD IF FIRST RUN IS TRUE SO THAT IT IS ONLY CHECKED ONCE
            for(const dir of this.library.directories) {
                if(this.library.detectSeries(dir)) {
                    this.libraryUi.addSeriesFolderIcon(dir);
                }
            }
            
            /*this.idb.saveLibrary(this.library).catch((error) => {
                console.error(error);
            });*/
            console.log(this.library);
        }
        this.setButtonState(false);
    }
    
    // Called From:  this.createLibrary()
    // directories   An array of the libraries current directories
    // Function:     Sets a status for the current directories so that the recordings
    //               UI is recreated if adding a new recording to the directory
    setFirstRunStatus(directories) {
        for(const dir of directories) {
            dir.firstRun = false;
        }
    }
    
    // Called From:  this.createLibrary()
    // Function:     Validates and sets the user input
    // Return:       False if there was an error, true if all inputs were set
    setUserInput() {
        const fullPath = this.validateFullPath($('#dirPath').val());
        const libraryName = $("#library-name").val();
        const title = $("#title-input").val();
        const subTitle = $("#sub-title-input").val();
        const dummyTime = $("#dummy-time").val();
        const genreOption = $("#genre-input").val();
        const dataSourceOpt = $('input[name="data-source"]:checked').val();
        const filterOption = $('input[name="filter-opt"]:checked').val();
        
        this.userInput.fullPath = fullPath;
        this.userInput.libraryName = libraryName;
        this.userInput.title = title;
        this.userInput.subTitle = subTitle;
        this.userInput.dummyDuration = dummyTime;
        this.userInput.genreOption = genreOption;
        this.userInput.dataSourceOpt = dataSourceOpt;
        this.userInput.filterOption = filterOption;
        //if(fullPath !== false) { this.userInput.fullPath = fullPath; } else { return false;/*diplayErrorToUser()*/ }
        //if(libraryName) { this.userInput.libraryName = libraryName; } else { return false;/*diplayErrorToUser()*/ }
        //if(title) { this.userInput.title = title; } else { return false;/*diplayErrorToUser()*/ }
        //if(subTitle) { this.userInput.subTitle = subTitle; } else { return false;/*diplayErrorToUser()*/ }
        //if(/^\d\d:[0-5]\d:[0-5]\d$/.test(dummyTime)) { this.userInput.dummyTime = dummyTime; } else { return false;/*diplayErrorToUser()*/ }
        //if(genreOption) { this.userInput.genreOption = genreOption; } else { return false;/*diplayErrorToUser()*/ }
        //if(dataSourceOpt) { this.userInput.dataSourceOpt = dataSourceOpt; } else { return false;/*diplayErrorToUser()*/ }
        //if(filterOption) { this.userInput.filterOption = filterOption; } else { return false;/*diplayErrorToUser()*/ }
        return true;
    }
    
    // Called From:  this.setUserInput()
    // dir:          The user input full directory path
    // Function:     Adds a seperator to the end of this.fullPath if it doesn't have one
    // Return:       The full directory path ending with the directory separator
    //               or a false if no path was input
    validateFullPath(dir) {
        if(dir) {
            if(dir.slice(-1) != this.userInput.dirSeparator) {
                return dir + this.userInput.dirSeparator;
            }
            return dir;
        }
        return false;
    }
    
    // Called From:  this.createLibrary()
    // state:        True or false
    // Function:     Disable or enable all buttons and inputs
    setButtonState(state) {
        document.getElementById(`run-filter`).disabled = state;
        document.getElementById(`dirPath`).disabled = state;
        document.getElementById(`prop-name`).disabled = state;
        document.getElementById(`custom-filter`).disabled = state;
    }
}

const importer = new importerTool();

/*//
function displayErrorToUser() {

}*/
