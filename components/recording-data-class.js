class directory {
    constructor(pathId, dirId, dirName) {
        this.dirId = dirId;                                      // A unique directory number ID - Used for collapse #id
        this.pathId = pathId;                                    // 'root-folder-subfolder-etc' Used for UI #id
        this.prevPathId = this.setPreviousDirectoryId(pathId);   // 'root-folder-subfolder' - Used for UI #location
        this.dirName = dirName;                                  // 'etc' - Used for UI name
        this.numFiles = 0;                                       // The number files in the directory
        this.numFolders = 0;                                     // The number of folders in the directory
        this.files = []                                          // An array of recording belonging to this folder
        this.subFolders = [];                                    // An array directory instances that are in this directory
        this.selected = false;                                   // True if the folder has been selected by the user
        this.firstRun = true;                                    // False when the directory UI has already been created                               
    }
    
    // Increment the number of folder in this directory
    updateNumFolders() {
        this.numFolders++;
    }
    
    // Called From:  constructor()
    // pathId:       Te current path ID
    // Function:     Slice off last part of the path ID to get the preus directory
    // Return:       The previous directory ID
    setPreviousDirectoryId(pathId) {
        const strEnd = pathId.lastIndexOf("-");
        return (strEnd > -1) ? pathId.slice(0, strEnd) : "";
    }
    
    // Called From:  recordingsLibrary - addRecordings()
    // file:         A recording instance
    // Function:     Add a file to this directory and increments file count
    // Return:       False is the file already exists, true if the file was added
    addFile(file) {
        this.files.push(file)
        this.numFiles++;
        
        // Sort file order when new files are added to the directory after the first run
        if(this.firstRun === false) {
            this.files.sort((a, b) => {
                a = a.recordingXmlVals.name;
                b = b.recordingXmlVals.name;
                
                if(a < b) {
                    return -1;
                } else if(a > b) {
                    return 1;
                }
                return 0;
            });
        }
    }
}

class recordingFile {
    constructor(idNum, blob, year, fileType, fileMime, relativePath, fullPathId, fileName, fullPath, Genre, Title, SubTitle, dummyDuration) {
        this.idNum = idNum;                    // A unique recording number
        this.blob = blob;                      // A file blob
        this.ffmpegStatus = null;              // True if FFmpeg run successfully false otherwise
        this.rating = null;                    // The recoring rating 1 to 5
        this.dummyDuration = dummyDuration;    // Used when the duration property wasn't found
    
        this.recordingData = {
            startTimeDate: "",                 // YYYY-MM-DDT - Sliced from startTime
            startTimeDuration: "",             // HH:MM:SS - Sliced from startTime
            duration: "",                      // HH:MM:SS
            year: year,                        // YYYY
            relativePath: relativePath,        // folder/another/myvid.avi
            fullPathId: fullPathId,            // full-path-folder-another
            fileType: fileType,                // video/x-msvideo
            filenameMime: fileMime             // .avi
        }
        
        this.recordingXmlVals = {
            oid: "",                           //
            name: fileName,                    // myvid - filters may apply
            channel: "User-Library",           // A constant channel name
            filename: fullPath,                // /home/me/folder/myvid.avi
            status: "READY",                   // A constant status string
            startTime: "",                     // YYYY-MM-DDTHH:MM:SS.00Z
            endTime: "",                       // YYYY-MM-DDTHH:MM:SS.00Z
            EventStart: "",                    //
            OID: "",                           //
            Title: Title,                      //
            SubTitle: SubTitle,                //
            Description: "",                   //
            ChannelOID: "",                    //
            StartTime: "",                     //
            EndTime: "",                       //
            FirstRun: "",                      //
            OriginalAirDate: "",               //
            GenresStart: "",                   //
            Genre: Genre,                      //
            UniqueID: `User-Library${idNum}`,  // A unique ID to avoid duplication
            EventEnd: "",                      //
            recordingEnd: ""                   //
        };
    }
    
    // Called From:  
    // opt           0 = function not called - 1 = Name Only - 2 = Name and (year)
    // Function:     Apply filename filtering based on selected user option
    filterFileName(opt) {
        let name = this.recordingXmlVals.name
        let year = this.recordingData.year
        // Remove non alphanumeric characters
        name = name.replace(/\./g, " ");
        name = name.replace(/[^a-zA-Z0-9 ]/g, "");
        
        let yearPos = name.lastIndexOf(year);
        if(yearPos > -1) {
            // Remove anything but the name
            name = name.substr(0, yearPos);
            
            // Add the year
            if(opt == 2) {
                name = name + " (" + year + ")";
            }
        // The year was in the directory name but not the file name
        } else if(year && opt == 2) {
            name = name.substr(0, yearPos);
            name = name + " (" + year + ")";
        }
        
        //Remove appended junk
        const junkFilters = ["DVDRip", "BrRip", "HDRip", "BluRay", "WEBRip", "WEB-HD", "720p", "1080p", "x264"];
        for(const filter of junkFilters) {
            const nameStr = name.toLowerCase();
            const filterPos = nameStr.lastIndexOf(filter.toLowerCase());
            if(filterPos > -1) {
                name = name.substr(0, filterPos - 1);
            }
        }
        // Remove prepended junk
        //name = name.replace(/.*[ ]{2,}/, "");
        this.recordingXmlVals.name = name.trim();
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when the startTime property is found
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Sets the recording properties startTime, startTimeDate and startTimeDuration
    setStartTimeProps(message, filter) {
        // Create startTime property if not found
        let startIndex = 0;
        if(message === false) {
            let date = new Date();
            message = date.toISOString();
        } else {
            startIndex = message.search(filter) + 18;
        }
        
        this.recordingXmlVals.startTime = message.substr(startIndex, 22) + "Z";
        this.recordingData.startTimeDate = this.recordingXmlVals.startTime.substr(0, 11);
        this.recordingData.startTimeDuration = this.recordingXmlVals.startTime.substr(11, 8);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when duration property is found
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Sets the recording duration property
    setDurationProp(message, filter) {
        // Add dummy time if duration not found
        let startIndex = 0;
        if(message === false) {
            message = this.dummyDuration;
        } else {
            startIndex = message.search(filter) + 10;
        }
        
        this.recordingData.duration = message.substr(startIndex, 8);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when a file has been checked and unlinked
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Checks if the startTime and duration properties have been set
    //               Sets the recording endTime property
    setEndTimeProp() {
        // CHeck that startTime and duration properties are set if not set them
        if(this.recordingXmlVals.startTime == "") {
            this.setStartTimeProps(false);
        }
        if(this.recordingData.duration == "") {
            this.setDurationProp(false);
        }
        let start = this.recordingData.startTimeDuration;
        let end = this.recordingData.duration;
        
        // Set the endTime property
        let endTimeDuration = this.addTimeStrings(start, end);
        let startDate = this.recordingData.startTimeDate;
        this.recordingXmlVals.endTime = startDate + endTimeDuration + ".00Z";
    }
    
    // Called From:  this.setEndTimeProp()
    // startTime:    The start time sting HH:MM:SS
    // endTime:      The end time sting HH:MM:SS
    // Function:     Adds two time strings together to produce a new time
    // Return:       The new time string HH:MM:SS
    addTimeStrings(startTime, endTime) {
        let start = startTime.split(":");
        let sSecs = (+start[0]) * 60 * 60 + (+start[1]) * 60 + (+start[2]); 
        let end = endTime.split(":");
        let eSecs = (+end[0]) * 60 * 60 + (+end[1]) * 60 + (+end[2]); 

        let date = new Date(1970,0,1);
        date.setSeconds(sSecs + eSecs);
        return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    }
    
    // Called From:  ...
    // Function:     ...
    // Return:       ...
    // https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references
    // https://stackoverflow.com/questions/730133/what-are-invalid-characters-in-xml
    setXml() {
        let recordingXML = `
            <recording>
            <oid>${this.recordingXmlVals.oid}</oid>
            <name>${this.recordingXmlVals.name}</name>
            <channel>${this.recordingXmlVals.channel}</channel>
            <filename>${this.recordingXmlVals.filename}</filename>
            <status>${this.recordingXmlVals.status}</status>
            <startTime>${this.recordingXmlVals.startTime}</startTime>
            <endTime>${this.recordingXmlVals.endTime}</endTime>
            <Event>
            <OID>${this.recordingXmlVals.OID}</OID>
            <Title>${this.recordingXmlVals.Title}</Title>
            <SubTitle>${this.recordingXmlVals.SubTitle}</SubTitle>
            <Description>${this.recordingXmlVals.Description}</Description>
            <ChannelOID>${this.recordingXmlVals.ChannelOID}</ChannelOID>
            <StartTime>${this.recordingXmlVals.StartTime}</StartTime>
            <EndTime>${this.recordingXmlVals.EndTime}</EndTime>
            <FirstRun>${this.recordingXmlVals.FirstRun}</FirstRun>
            <OriginalAirDate>${this.recordingXmlVals.OriginalAirDate}</OriginalAirDate>
            <Genres>
            <Genre>${this.recordingXmlVals.Genre}</Genre>
            </Genres>
            <UniqueID>${this.recordingXmlVals.UniqueID}</UniqueID>
            </Event>
            </recording>
        `;
        return recordingXML;
    }
}

class recordingsLibrary {
    constructor() {
        this.idNum = null;
        this.userInput = {};                // An object of user input paramters
        this.directories = [];              // An array of directory class instances
        this.numDirectories = 0;            // The current directory number
        this.recordings = [];               // An array of all recording class instances in this library
        this.numRecordings = 0;             // The current recording number
    }
    
    // Called From:  file://importer-tool.js - createLibrary()
    // blob:         A recording file blob
    // Function:     Add a recording to the library and create its folder and file structure
    // Return:       A directory instance or path id for a file if no new directory needs to be created
    //               False if the recording was not a video file
    async addRecording(blob, userInput, idNum) {
        // Set the user input values object
        this.userInput = userInput;
        
        // Get the blobs file properties
        const blobFound = this.checkBlobExists(blob);
        const fileType = blob.type;
        const fileMime = this.checkMimeTypeStr(blob.name);
        const fileName = blob.name.substr(0, blob.name.lastIndexOf(fileMime));
        const relativePath = blob.webkitRelativePath.replaceAll("/", userInput.dirSeparator);
        
        // If the blob doesn't already exist in the library and it is a video file add it
        if(!blobFound && (fileType.startsWith('video/') || fileMime != false)) {
            const recPathId = this.getPathId(userInput.libraryName, relativePath, userInput.dirSeparator);
            let dirName;                // The unfiltered directory name
            let newDirectory = false;   // The first new directory that is created
            
            // Check if a directory with the full path already exists
            if(this.getDirectory(recPathId) === false) {
                const recPathIdArr = recPathId.split("-").filter(Boolean);
                let recPathArr = `${userInput.libraryName}${userInput.dirSeparator}${relativePath}`;
                recPathArr = recPathArr.split(userInput.dirSeparator).filter(Boolean);
                let pathId = "";
                let prevPathId = "";
                let pathCount = 0;
                
                // Check each part of the recording path
                for(const path of recPathIdArr) {
                    pathId = (pathId == "") ? path : pathId + "-" + path;
                    
                    // Create the directory if it doesn't exist
                    if(this.getDirectory(pathId) === false) {
                        dirName = recPathArr[pathCount];
                        this.directories.push(new directory(pathId, this.numDirectories, dirName));
                        if(newDirectory === false) { newDirectory = this.getDirectory(pathId); }
                        this.numDirectories++;
                        
                        // Increment the number of folders for the previous folder and add subfolder for previous folder
                        if(prevPathId != "") {
                            this.getDirectory(prevPathId).subFolders.push(this.getDirectory(pathId));
                            this.getDirectory(prevPathId).updateNumFolders();
                        }
                    }
                    pathCount++;
                    prevPathId = pathId;
                }
            }
            
            // Extract a year YYYYY from the file or directory name if it has one
            const year = this.getRecordingYear([fileName, dirName]);
            // Create a new recording instance and add the file to the directory
            this.recordings.push(new recordingFile (
                this.numRecordings,
                blob,
                year,
                fileType,
                fileMime,
                relativePath,
                recPathId,
                fileName,
                `${userInput.fullPath}${relativePath}`,
                userInput.Genre,
                userInput.title,
                userInput.subTitle,
                userInput.dummyDuration
            ));
            const recording = this.recordings[this.numRecordings];
            this.getDirectory(recPathId).addFile(recording);
            
            // Filter the file name if the user has choosen a filter option
            if(userInput.filterOption != 0) {
                recording.filterFileName(userInput.filterOption);
            }
            
            // Create dummy startTime and endTime, gets overwritten if user chooses a data source and it finds a value
            recording.setEndTimeProp();
            this.numRecordings++;
            
            if(newDirectory === false) {
                return {"directory": this.getDirectory(recPathId), "newDir": false, "path": recPathId, "file": recording};
            }
            return {"directory": newDirectory, "newDir": true, "path": recPathId, "file": recording}
        }
        return false;
    }
    
    // Called From:  this.addRecording()
    // blob          blob.name video.mp4
    // Function:     Checks if a blob with matching properties already exists in the library
    // Return:       True if the blob alreay exists false otherwise
    checkBlobExists(blob) {
        const name = blob.name;
        const relativePath = blob.webkitRelativePath;
        const size = blob.size;
        
        for(let n = 0; n < this.recordings.length; n++) {
            let b = this.recordings[n].blob;
            if(b.name == name && b.webkitRelativePath == relativePath && b.size == size) {
                //The blob already exists not adding to recordings
                return true;
            }
        }
        return false;
    }
    
    // Called From:  this.addRecording()
    // filename      blob.name video.mp4
    // Function:     Checks the file name string for a valid video mime type
    // Return:       The mime if found or false
    checkMimeTypeStr(filename) {
        const mimes = [".mp4", ".avi", ".mkv", ".webm", ".flv", "ogg", ".mov", ".wmv", ".rmvb", ".ts"];
        for(let mimeIndex = 0; mimeIndex < mimes.length; mimeIndex++) {
            const strEnd = filename.lastIndexOf(mimes[mimeIndex]);
            if(strEnd > -1) {
                //Valid file type
                return mimes[mimeIndex];
            }
        }
        return false;
    }
    
    // Called From:  ...
    // pathId:         ..
    // Function:     ..
    // Return:       ...
    getPathId(libraryName, relativePath, dirSeparator) {
        const libraryPath = libraryName + dirSeparator
        + relativePath.slice(0, relativePath.lastIndexOf(dirSeparator));    // Get the library path without the file name
        let libraryPathId = libraryPath.replaceAll("-", "");                // Remove any id spearator characters '-'
        libraryPathId = libraryPathId.replaceAll(dirSeparator, "-");        // Replace all directory separator with the id seperator
        libraryPathId = libraryPathId.replace(/[^a-zA-z0-9-]/g, "");        // Remove all non alphanumeric character except the id separator
        
        return libraryPathId;
    }
    
    // Called From:  ...
    // pathId:         ..
    // Function:     ..
    // Return:       ...
    getDirectory(pathId) {
        for(let n = 0; n < this.directories.length; n++) {
            if(this.directories[n].pathId == pathId) {
                return this.directories[n];
            }
        }
        return false;
    }
    
    // Called From:  this.addRecording()
    // strArr        An array containg string to search for a year value
    // Function:     Checks if a year(YYYY) string is in the name
    //               Strips all character except aphanumeric and whitespaces
    //               Creates an array from the string and reverses it
    //               Assumes that the year is usually at the end of the name
    // Return:       year(YYYY)
    getRecordingYear(strArr) {
        let year = false;
        for(let str of strArr) {
            str = str.replace(/[^a-zA-Z0-9 ]/g, " ");
            let strParts = str.split(" ").reverse();
            
            // Check if the string contains YYYY and validate it
            let yearFound = strParts.some(function(str, index) {
                if(/\d{4}/.test(str)) {
                    if(/^(19[3-9]\d|20[0-4]\d|2050)$/.test(str)) {
                        year = strParts[index];
                        return true
                    }
                }
            });
            if(yearFound) {
                return year;
            }
        }
        return year;
    }
    
    // Called From:  browser-nativefs.mjs (fileSave)
    // Function:     Creates the XML for each recording
    // Return:       An array with each line of XML
    getRecordingsXML() {
        const recordingsStart = "<recordings>\n";
        const recordingsEnd = "</recordings>";
        let xmlArr = [];
        xmlArr.push(recordingsStart);
        
        // Set XML for each recording
        for(let n = 0; n < this.numRecordings; n++) {
            xmlArr.push(this.recordings[n].setXml());
        }
        xmlArr.push(recordingsEnd);
        return xmlArr;
    }
}
