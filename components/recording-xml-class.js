let debug = false;
function debugMsg(message) {
    if(debug) {
        console.log(message);
    }
}

class recordingsTemplate {
    constructor() {
        this.rootDir = "";                   // User input path
        this.rootDirName = "";               // The last part of this.rootDir path
        this.dirSeparator = "";              // "\" or "/"
        this.numRecordings = 0;              // The total number of recording added to on each run
        this.recordingCount = 0;             // The current recording number
        this.recordings = [];                // An array of recording objects
        this.dummyDuration = "02:00:00";     // used when the duration property wasn't found
        this.propFilters = {
            name: "FS.writeFile ",           // 13 - Not in use
            startTime: "creation_time   : ", // 18
            duration: "Duration: "           // 10
        };
        this.ui = null;                      // A recordingUI class instance
        
        // Get the user input dir and set the path separator
        let rt = this;
        window.addEventListener("load", function() {
            rt.dirSeparator = rt.getPathChar();
            rt.rootDir = document.querySelector('#dirPath').value;
            document.querySelector('#dirPath').addEventListener("change", function() {
                rt.rootDir = document.querySelector('#dirPath').value;
            });
        });
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // ui:           A class instance
    // Function:     Sets the directory path separation character depending on OS
    // Return:       none
    addUiClass(ui) {
        this.ui = ui;
    }
    
    // Called From:  constructor()
    // Function:     Sets the directory path separation character depending on OS
    // Return:       The directory separator character
    getPathChar() {
        debugMsg(`[info] Getting getPathChar()`);
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
            debugMsg(`[info] Got getPathChar() ${dirSeparator}`);
            return dirSeparator;
            
        }  catch (err) {
            console.error(`[ERROR] Error in getPathChar(): ${err}`);
        }
    }
    
    // Called From:  constructor()
    // dir:          The user input root directory path
    // Function:     Add a seperator to the end of this.rootDir if it doesn't have one
    //               Sets this.rootDirName as last part of this.rooDir path
    // Return:       none
    validateRootDir(dir) {
        debugMsg(`[info] Checking the root directory path ${dir}`);
        try {
            let sep = this.dirSeparator
            if(dir.slice(-1) != sep) {
                debugMsg(`[info] Adding root directory separator`);
                this.rootDir = dir + sep;
            }
            
            debugMsg(`[info] Setting the root directory name`);
            let dirNamePos = this.rootDir.lastIndexOf(sep, (this.rootDir.length - 2)) + 1;
            let dirNameLen = this.rootDir.length - (dirNamePos + 1);
            this.rootDirName = this.rootDir.substr(dirNamePos, dirNameLen);
            
        }  catch (err) {
            console.error(`[ERROR] Error in validateRootDir(): ${err}`);
        }
        debugMsg(`[info] Root dir directory path ${dir} checked`);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // blob:         A file blob
    // dirPath:      blob.webkitRelativePath - "/video/genre/movie.mp4"
    // filename:     blob.name - "movie.mp4"
    // mimetype:     this.checkMimeTypeStr(filename) - ".mp4"
    // Function:     Adds a new recording object to this.recordings[] and sets its properties
    //               Runs the users custom filter if the values are set
    // Return:       none
    addRecording(blob, dirPath, filename, mimetype) {
        debugMsg(`[info] Adding new recording for ${filename}`);
        try {
            debugMsg(`[info] Setting the relative path in the correct format`);
            let relativePath = dirPath.replaceAll("/", this.dirSeparator);
            
            debugMsg(`[info] Creating new recording and setting its properties`);
            this.recordings.push(new recording);
            this.recordings[this.recordingCount].recordingId = this.recordingCount; // redundant as need count to get id an array index is id?
            this.recordings[this.recordingCount].blob = blob;
            this.recordings[this.recordingCount].recordingXmlVals.fullPath = this.rootDir + relativePath;
            this.recordings[this.recordingCount].recordingXmlVals.relativePath = relativePath;
            this.recordings[this.recordingCount].recordingXmlVals.filename = filename;
            this.recordings[this.recordingCount].recordingXmlVals.filenameMime = mimetype;
            
            // Get the filename without the extension
            let name = filename.substr(0, filename.lastIndexOf(mimetype))
            this.recordings[this.recordingCount].recordingXmlVals.name = name;
            
            // Extract the year from the name if it has it
            this.setRecordingYear(name);
            
            // If the custom filter inputs are set then run the custom filter
            let filter = $("#custom-filter").val();
            let propName = $("#prop-name").val();
            if(filter && propName) {
                this.runCustomFilter(filter, propName, this.recordingCount);
            }
            
        }  catch (err) {
            console.error(`[ERROR] Error in addRecording(): ${err}`);
        }
        debugMsg(`[info] New recording added for ${filename}`);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when this.propFilters.startTime is found
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Sets the recording properties startTime, startTimeDate and startTimeDuration
    // Return:       none
    setStartTimeProps(message) {
        debugMsg(`[info] Setting the setStartTimeProps()`);
        try {
            debugMsg(`[info] checking if startTime property was found`);
            let startIndex = 0;
            if(message === false) {
                debugMsg(`[info] startTime property not found creating date`);
                let date = new Date();
                message = date.toISOString();
            } else {
                startIndex = message.search(this.propFilters.startTime) + 18;
            }
            
            debugMsg(`[info] setting startTime properties`);
            let recProps = this.recordings[this.recordingCount].recordingXmlVals;
            recProps.startTime = message.substr(startIndex, 22) + "Z";
            recProps.startTimeDate = recProps.startTime.substr(0, 11);
            recProps.startTimeDuration = recProps.startTime.substr(11, 8);
            
        }  catch (err) {
            console.error(`[ERROR] Error in setStartTimeProps(): ${err}`);
        }
        debugMsg(`[info] setStartTimeProps() set`);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when this.propFilters.duration is found
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Sets the recording duration property
    // Return:       none
    setDurationProp(message) {
        debugMsg(`[info] Setting the setDurationProp()`);
        try {
            debugMsg(`[info] checking if duration property was found`);
            let startIndex = 0;
            if(message === false) {
                debugMsg(`[info] duration property not found setting duration to ${this.dummyDuration}`);
                message = this.dummyDuration;
            } else {
                startIndex = message.search(this.propFilters.duration) + 10;
            }
            
            debugMsg(`[info] setting duration property`);
            this.recordings[this.recordingCount].recordingXmlVals.duration = message.substr(startIndex, 8);
            
        }  catch (err) {
            console.error(`[ERROR] Error in setDurationProp(): ${err}`);
        }
        debugMsg(`[info] setDurationProp() set`);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when a file has been checked and unlinked
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Checks if the startTime and duration properties have been set
    //               Sets the recording endTime property
    // Return:       none
    setEndTimeProp() {
        debugMsg(`[info] Setting the setEndTimeProp()`);
        try {
            debugMsg(`[info] checking if startTime and duration properties are set`);
            if(this.recordings[this.recordingCount].recordingXmlVals.startTime == null) {
                this.setStartTimeProps(false);
            }
            if(this.recordings[this.recordingCount].recordingXmlVals.duration == null) {
                this.setDurationProp(false);
            }
            let start = this.recordings[this.recordingCount].recordingXmlVals.startTimeDuration;
            let end = this.recordings[this.recordingCount].recordingXmlVals.duration;
            
            debugMsg(`[info] setting endTime property`);
            let endTimeDuration = this.addTimeStrings(start, end);
            let startDate = this.recordings[this.recordingCount].recordingXmlVals.startTimeDate;
            this.recordings[this.recordingCount].recordingXmlVals.endTime = startDate + endTimeDuration + ".00Z";
            
        }  catch (err) {
            console.error(`[ERROR] Error in setEndTimeProp(): ${err}`);
        }
        debugMsg(`[info] setEndTimeProp() set`);
    }
    
    // Called From:  this.setEndTimeProp()
    // startTime:    The start time sting HH:MM:SS
    // endTime:      The end time sting HH:MM:SS
    // Function:     Adds two time strings together to produce the sum
    // Return:       The new time string HH:MM:SS
    addTimeStrings(startTime, endTime) {
        debugMsg(`[info] Adding time string together`);
        try {
            let start = startTime.split(":");
            let sSecs = (+start[0]) * 60 * 60 + (+start[1]) * 60 + (+start[2]); 
            let end = endTime.split(":");
            let eSecs = (+end[0]) * 60 * 60 + (+end[1]) * 60 + (+end[2]); 

            let date = new Date(1970,0,1);
            date.setSeconds(sSecs + eSecs);
            return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
            
        }  catch (err) {
            console.error(`[ERROR] Error in addTimeStrings(): ${err}`);
        }
    }
    
    // Called From:  browser-nativefs.mjs (fileSave)
    // Function:     Creates the XML for each recording
    // Return:       An array with each line of XML
    getRecordingsXML() {
        debugMsg(`[info] creating recordings XML`);
        try {
            let xmlArr = [];
            let recordingsStart = "<recordings>\n";
            let recordingsEnd = "</recordings>";
            xmlArr.push(recordingsStart);
            
            debugMsg(`[info] Setting XML for each recording`);
            for(let n = 0; n < this.numRecordings; n++) {
                this.setRecordingsXML(n);
                for(let key in this.recordings[n].recordingXML) {
                    if(this.recordings[n].recordingXML.hasOwnProperty(key)) {
                        var xmlTag = this.recordings[n].recordingXML[key];
                        xmlArr.push(xmlTag);
                    }
                }
            }
            xmlArr.push(recordingsEnd);
            return xmlArr;
            
        }  catch (err) {
            console.error(`[ERROR] Error in getRecordingsXML(): ${err}`);
        }
    }
    
    // Called From:  this.getRecordingsXML()
    // recId         The this.recordings[] index number
    // Function:     Creates the XML for each recording
    // Return:       none
    setRecordingsXML(recId) {
        debugMsg(`[info] Setting the recording XML for ${recId}`);
        try {
            debugMsg(`[info] reating recording XML`);
            let recXML = this.recordings[recId].recordingXML;
            let recProps = this.recordings[recId].recordingXmlVals;
            
            recXML.name = "<name>" + recProps.name + "</name>\n";
            recXML.filename = "<filename>" + recProps.fullPath + "</filename>\n";
            recXML.startTime = "<startTime>" + recProps.startTime + "</startTime>\n";
            recXML.endTime = "<endTime>" + recProps.endTime + "</endTime>\n";
            recXML.Title = "<Title>" + recProps.Title + "</Title>\n";
            recXML.Genre = "<Genre>" + recProps.Genre + "</Genre>\n";
            
        }  catch (err) {
            console.error(`[ERROR] Error in setRecordingsXML(): ${err}`);
        }
        debugMsg(`[info] Recording XML for ${recId} set`);
    }
    
    // Called From:  this.addRecording()
    // nameStr       A recording name string without athe file extension
    // Function:     Checks if a year(YYYY) string is in the name
    // Return:       none
    setRecordingYear(nameStr) {
        debugMsg(`[info] Checking for a year in the recording name`);
        try {
            // Strips all character except aphanumeric and whitespaces
            // Creates an array from the string and reverses it
            // Assumes that the year is usually at the end of the name
            // which avoids a year in the actual recording name
            nameStr = nameStr.replace(/[^a-zA-Z0-9 ]/g, " ");
            let nameArr = nameStr.split(" ").reverse();
            
            let year = nameArr.find(function(str) {
                return /\d{4}/.test(str);
            });
            
            if(year) {
                debugMsg(`[info] The year ${year} was found`);
                this.recordings[this.recordingCount].recordingXmlVals.year = year;
            }
            
        }  catch (err) {
            console.error(`[ERROR] Error in setRecordingYear(): ${err}`);
        }
        debugMsg(`[info] Recording name checked for year`);
    }
    
    // Called From:  this.addRecording()
    // filter        A user input regular expression /[^a-z ]/g
    // propName      The recording property name
    // recNum        The current recording number
    // Called From:  file://recording-ui-class.js (constructor())
    // recNum        false
    // Function:     Runs a user customr replace regex on each file name
    // Return:       none
    runCustomFilter(filter, propName, recNum) {
        debugMsg(`[info] Running users custom replace filter`);
        //try {
            if(filter && propName) {
                const stringToRegex = str => {
                    // Main regex
                    const main = str.match(/\/(.+)\/.*/)[1];
                    // Regex options
                    const options = str.match(/\/.+\/(.*)/)[1];
                    // Compiled regex
                    return new RegExp(main, options);
                }
                
                if(recNum === false) {
                    for(let n = 0; n < template.recordings.length; n++) {
                        let propVal = template.recordings[n].recordingXmlVals[propName].replace(stringToRegex(filter), "");
                        template.recordings[n].recordingXmlVals[propName] = propVal;
                        
                        debugMsg(`[info] ${propName} value changed to ${propVal} updating UI`);
                        this.ui.addFileUi(this.ui.files[n].fileId, n, true)
                    }
                } else {
                    let propVal = template.recordings[recNum].recordingXmlVals[propName].replace(stringToRegex(filter), "");
                    template.recordings[recNum].recordingXmlVals[propName] = propVal;
                }
            }
            
        /*}  catch (err) {
            console.error(`[ERROR] Error in runCustomFilter(): ${err}`);
        }*/
        debugMsg(`[info] Custom replace filter has run`);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // filename      blob.name video.mp4
    // Function:     Checks the file name string for a valid video mime type
    // Return:       The mime if found or false
    checkMimeTypeStr(filename) {
        debugMsg(`[info] ...`);
        try {
            let mimes = [".mp4", ".avi", ".mkv", ".webm", ".flv", "ogg", ".mov"];
            for(let mimeIndex = 0; mimeIndex < mimes.length; mimeIndex++) {
                let strEnd = filename.lastIndexOf(mimes[mimeIndex]);
                if(strEnd > -1) {
                    debugMsg(`[info] ...`);
                    return mimes[mimeIndex];
                }
            }
            return false;
            
        }  catch (err) {
            console.error(`[ERROR] Error in checkMimeTypeStr(): ${err}`);
        }
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // blob          blob.name video.mp4
    // Function:     Checks if a blob with matching properties already exists in the library
    // Return:       True if the blob alreay exists false otherwise
    checkBlobExists(blob) {
        debugMsg(`[info] Checking if blob already exists`);
        try {
            const name = blob.name;
            const relativePath = blob.webkitRelativePath;
            const size = blob.size;
            for(let n = 0; n < this.recordings.length; n++) {
                let b = this.recordings[n].blob;
                if(b.name == name && b.webkitRelativePath == relativePath && b.size == size) {
                    debugMsg(`[info] The blob already exists, checking the blobs status`);
                    if(!this.recordings[n].status) {
                        debugMsg(`[info] The blob status is false try adding it again`);
                        return false;
                    }
                    return true;
                }
            }
            return false;
            
        }  catch (err) {
            console.error(`[ERROR] Error in checkBlobExists(): ${err}`);
        }
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // status        True if the file could be read by FFmpeg false otherwise
    // recNum        The recording number
    // Function:     Set the status of the current recording
    // Return:       none
    setRecordingStatus(status, recNum) {
        debugMsg(`[info] Setting the recording status`);
        try {
            this.recordings[recNum].status = status;
            
        }  catch (err) {
            console.error(`[ERROR] Error in setRecordingStatus(): ${err}`);
        }
    }
}
 
let recording = function() {
    this.recordingId = 0;
    this.blob = null;
    this.status = null;
    this.recordingXML = {
        recordingStart: "<recording>\n",
        oid: "<oid></oid>\n",
        name: "<name></name>\n",
        channel: "<channel>User-Library</channel>\n",
        filename: "<filename></filename>\n",
        status: "<status>READY</status>\n",
        startTime: "<startTime></startTime>\n",
        endTime: "<endTime></endTime>\n",
        EventStart: "<Event>\n",
        OID: "<OID></OID>\n",
        Title: "<Title></Title>\n",
        SubTitle: "<SubTitle></SubTitle>\n",
        Description: "<Description></Description>\n",
        ChannelOID: "<ChannelOID></ChannelOID>\n",
        StartTime: "<StartTime></StartTime>\n",
        EndTime: "<EndTime></EndTime>\n",
        FirstRun: "<FirstRun></FirstRun>\n",
        OriginalAirDate: "<OriginalAirDate></OriginalAirDate>\n",
        GenresStart: "<Genres>\n",
        Genre: "<Genre></Genre>\n",
        GenresEnd: "</Genres>\n",
        UniqueID: "<UniqueID></UniqueID>\n",
        EventEnd: "</Event>\n",
        recordingEnd: "</recording>\n"
    };
    this.recordingXmlVals = {
        startTime: null,                 // YYYY-MM-DDTHH:MM:SS.00Z
        startTimeDate: null,             // YYYY-MM-DDT
        startTimeDuration: null,         // HH:MM:SS
        endTime: null,                   // YYYY-MM-DDTHH:MM:SS.00Z
        duration: null,                  // HH:MM:SS
        fullPath: null,                  // /home/me/folder/myvid.avi
        relativePath: null,              // folder/myvid.avi
        filename: null,                  // myvid.avi
        name: null,                      // myvid
        filenameMime: null,              // .avi
        Title: "test",                   //
        SubTitle: "sub-test",            //
        Genre: "test",                   //
        year: null                       // YYYY
    };
}

