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
            let filter = $("#custom-filter").val();
            let propName = $("#prop-name").val();
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
                    this.savedLibraries.push(new recordingsLibrary(library));
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
    
    async createLibrary(blobs) {
        const inputSuccess = this.setUserInput();
        this.setButtonState(true);

        let recCount = 0;
        let numRecs = blobs.length;
        if(this.userInput.dataSourceOpt == 1) {
            $("#progress-indicator").css("display", "block");
            $(".progress-bar-title").html(`<span id="file-progress">FFmpeg Loading...</span>`);
            $("#progress").css("width", Math.floor(100 / numRecs * recCount) + "%");
            this.ffmpeg = new ffmpegData();
            await this.ffmpeg.loadFfmpeg();
        }
        
        if(inputSuccess === true) {
            for(const blob of blobs) {
                // Add each recording and return an object with recording data
                const recordingData = await this.library.addRecording(blob, this.userInput, this.libraryNum);
                
                // Get details from a data source if selected
                if(this.userInput.dataSourceOpt == 1) {
                    if(blob.type.startsWith('video/') || this.library.checkMimeTypeStr(blob.name)) {
                        $(".progress-bar-title").html(`FFmpeg checking file: <span id="file-progress">\
                        ${this.library.recordings[recCount].recordingXmlVals.name}</span>`);
                        await this.ffmpeg.runFfmpeg(this.library.recordings[recCount]);
                        recCount++;
                    } else {
                        numRecs--;
                    }
                } else if(this.userInput.dataSourceOpt == 2) {
                    //iTunes.func(blobs);
                }
                
                // Creating UI for current file and directories
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
            this.setFirstRunStatus(this.library.directories);
            
            // Reset the progress bar if set
            $("#progress-indicator").css("display", "none");
            $("#progress").css("width", "0%");
            
            this.idb.saveLibrary(this.library).then((result) => {
            
            }).catch((error) => {
                console.error(error);
            });
            console.log(this.library);
            
        } else {
            alert(`There was an error with ${inputSuccess}`);
        }
        this.setButtonState(false);
    }
    
    setFirstRunStatus(directories) {
        for(const dir of directories) {
            dir.firstRun = false;
        }
    }
    
    // Called From:  createLibrary()
    // Function:     Validates and sets the user input
    // Return:       Error name if there was an error, true if all inputs were set
    setUserInput() {
        // Validate inputs
        let error = false;
        
        (this.validateFullPath($('#dirPath').val()) !== false) 
        ? this.userInput.fullPath = this.validateFullPath($('#dirPath').val()) : error = "Directory Path";
        ($("#library-name").val() !== "") 
        ? this.userInput.libraryName = $("#library-name").val() : error = "Library Name";
        this.userInput.title = $("#title-input").val();
        this.userInput.subTitle = $("#sub-title-input").val();
        
        (/^\d\d:[0-5]\d:[0-5]\d$/.test($("#dummy-time").val()))
        ? this.userInput.dummyDuration = $("#dummy-time").val() : this.userInput.dummyDuration = "02:00:00";
        
        this.userInput.genreOption = $("#genre-input").val();                           // Select option
        this.userInput.dataSourceOpt = $('input[name="data-source"]:checked').val();    // Radio button option
        this.userInput.filterOption = $('input[name="filter-opt"]:checked').val();      // Radio button option
        
        if(error !== false) {
            // displayErrorToUser(error);
            return error;
        }
        return true;
    }
    
    // Called From:  this.setUserInput()
    // dir:          The user input full directory path
    // Function:     Adds a seperator to the end of this.fullPath if it doesn't have one
    // Return:       The root directory ending with the directory separator
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
    
    loadLirary(library) {
        //this.library = library
        //this.userInput = library.userInput
        //this.createLibraryUi();
    }
    
    // Called From:  constructor() event listner
    // filter        A user input regular expression /[^a-z ]/g
    // propName      The recording property name
    // Function:     Runs a user customr replace regex on each file name
    runCustomFilter(filter, propName, directories) {
        if(filter && propName) {
            // Check which directories have been selected
            for(const dir of directories) {
                // Apply filter to files in selected directory
                if(dir.selected === true) {
                    try {
                        const stringToRegex = str => {
                            // Main regex
                            const main = str.match(/\/(.+)\/.*/)[1]
                            
                            // Regex options
                            const options = str.match(/\/.+\/(.*)/)[1]
                            
                            // Compiled regex
                            return new RegExp(main, options)
                        }
                        
                        for(const file of dir.files) {
                            let propVal = file.recordingXmlVals[propName].replace(stringToRegex(filter), "");
                            file.recordingXmlVals[propName] = propVal;
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
            $("#error-message").css("display", "block");
            $("#error-message").html("You need to select a property and input a regex string");
        }
    }
    
    // Disable buttons when adding recordings enable them again after
    setButtonState(state) {
        document.getElementById(`run-filter`).disabled = state;
        document.getElementById(`dirPath`).disabled = state;
        document.getElementById(`prop-name`).disabled = state;
        document.getElementById(`custom-filter`).disabled = state;
    }
}

const importer = new importerTool();
