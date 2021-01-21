let debug = false;
function debugMsg(message) {
    if(debug) {
        console.log(message);
    }
}
 
class recording {
    constructor(idNum) {
        this.idNum = idNum;                    // A unique recording number
        this.blob = null;                      // A file blob
        this.ffmpegStatus = null;              // True if FFmpeg run successfully false otherwise
        this.rating = null;                    // The recoring rating 1 to 5
        this.dummyDuration = "02:00:00";              // Used when the duration property wasn't found
    
        this.recordingData = {
            startTimeDate: "",                 // YYYY-MM-DDT - Sliced from startTime
            startTimeDuration: "",             // HH:MM:SS - Sliced from startTime
            duration: "",                      // HH:MM:SS
            year: "",                          // YYYY
            relativePath: "",                  // folder/another/myvid.avi
            fullPathArr: [],                   // [] relativePath
            fullPathIdArr: [],                 // [] relativePath.replace(/[^a-zA-z0-9/]/g)
            fullPathId: "",                    // full-path-folder-another
            fileType: "",                      // video/x-msvideo
            filenameMime: ""                   // .avi
        }
        
        this.recordingXmlVals = {
            oid: "",                           //
            name: "",                          // myvid - filters may apply
            channel: "User-Library",           // A constant channel name
            filename: "",                      // /home/me/folder/myvid.avi
            status: "READY",                   // A constant status string
            startTime: "",                     // YYYY-MM-DDTHH:MM:SS.00Z
            endTime: "",                       // YYYY-MM-DDTHH:MM:SS.00Z
            EventStart: "",                    //
            OID: "",                           //
            Title: "",                         //
            SubTitle: "",                      //
            Description: "",                   //
            ChannelOID: "",                    //
            StartTime: "",                     //
            EndTime: "",                       //
            FirstRun: "",                      //
            OriginalAirDate: "",               //
            GenresStart: "",                   //
            Genre: "",                         //
            UniqueID: `User-Library${idNum}`,  // A unique ID to avoid duplication
            EventEnd: "",                      //
            recordingEnd: ""                   //
        };
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when the startTime property is found
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Sets the recording properties startTime, startTimeDate and startTimeDuration
    // Return:       none
    setStartTimeProps(message, filter) {
        debugMsg(`[info] Start setStartTimeProps()`);
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
        debugMsg(`[info] End setStartTimeProps()`);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when duration property is found
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Sets the recording duration property
    // Return:       none
    setDurationProp(message, filter) {
        debugMsg(`[info] Start setDurationProp()`);
        // Add dummy time if duration not found
        let startIndex = 0;
        if(message === false) {
            message = this.dummyDuration;
        } else {
            startIndex = message.search(filter) + 10;
        }
        
        this.recordingData.duration = message.substr(startIndex, 8);
        debugMsg(`[info] End setDurationProp()`);
    }
    
    // Called From:  file://start-recording-ffmpeg.js
    // message:      FFmpeg logger output when a file has been checked and unlinked
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Checks if the startTime and duration properties have been set
    //               Sets the recording endTime property
    // Return:       none
    setEndTimeProp() {
        debugMsg(`[info] Start setEndTimeProp()`);
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
        debugMsg(`[info] End setEndTimeProp()`);
    }
    
    // Called From:  this.setEndTimeProp()
    // startTime:    The start time sting HH:MM:SS
    // endTime:      The end time sting HH:MM:SS
    // Function:     Adds two time strings together to produce a new time
    // Return:       The new time string HH:MM:SS
    addTimeStrings(startTime, endTime) {
        debugMsg(`[info] Start addTimeStrings(${startTime}, ${endTime})`);
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

class recordingsTemplate {
    constructor(savedData) {
        this.dirSeparator = this.getPathSeperator();  // Set the directory path separator \ or /
        this.fullPath = "";                           // Full directory path of files
        this.rootDirName = "";                        // Last part of this.fullPath
        this.recordings = [];                         // An array of recording class instances
        this.numRecordings = 0;                       // The current recording number
        
        if(savedData !== false) {
            this.loadTemplate(savedData);
        }
    }
    
    loadTemplate(savedData) {
        this.dirSeparator = savedData.dirSeparator;
        this.fullPath = savedData.fullPath;
        this.rootDirName = savedData.rootDirName;
        this.recordings = savedData.recordings;
        this.numRecordings = savedData.numRecordings;
    }
    
    // Return the array of recordings
    getRecordings() {
        return this.recordings;
    }
    
    // Called From:  constructor()
    // Function:     Sets the directory path separation character depending on OS
    // Return:       The directory separator character
    getPathSeperator() {
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
            console.error(`[ERROR] Error in getPathSeperator(): ${err}`);
        }
    }
    
    // Called From:  file://browser-nativefs.js
    // blobs:        An array of file blobs
    // opt           ...
    // Function:     ...
    // Return:       none
    addRecordings(blobs, opt) {
        debugMsg(`[info] Start addRecordings()`);
        // Set the root directory and name from user input
        this.fullPath = this.validateRootDir(document.querySelector('#dirPath').value);
        this.rootDirName = this.getDirName(this.fullPath); // The last part of this.fullPath path
        const filterOption = $('input[name="filter-opt"]:checked').val();
        const genreOption = $("#genre-input").val();
        const title = $("#title-input").val();
        const subTitle = $("#sub-title-input").val();
        const duration = $("#dummy-time").val();
        
        for(const blob of blobs) {
            debugMsg("[info] Checking if the recording is a video file");
            const blobFound = this.checkBlobExists(blob);
            const fileType = blob.type;
            const fileMime = this.checkMimeTypeStr(blob.name);
            const fileName = blob.name.substr(0, blob.name.lastIndexOf(fileMime));
            
            if(!blobFound && fileType.startsWith('video/') || !blobFound &&  fileMime != false) {
                debugMsg(`[info] Creating new recording for '${blob.name}' and setting its properties`);
                this.recordings.push(new recording(this.numRecordings));
                const curRec = this.recordings[this.numRecordings];
                const xmlVals = this.recordings[this.numRecordings].recordingXmlVals;
                const dataVals = this.recordings[this.numRecordings].recordingData;
                curRec.blob = blob;
                curRec.recordingData.fileType = fileType;
                curRec.recordingData.filenameMime = fileMime;
                
                const relativePath = blob.webkitRelativePath.replaceAll("/", this.dirSeparator);
                const dirName = this.getDirName(relativePath);
                const year = this.getRecordingYear([fileName, dirName]);
                dataVals.relativePath = relativePath;
                xmlVals.filename = this.fullPath + relativePath;
                dataVals.year = year;
                
                let rootPath = this.rootDirName + "/" + relativePath;
                const fullPathArr = rootPath.slice(0, rootPath.lastIndexOf(this.dirSeparator)).split(this.dirSeparator);
                dataVals.fullPathArr = fullPathArr.filter(Boolean)
                
                rootPath = rootPath.replace(/[^a-zA-z0-9/]/g, "");
                rootPath = rootPath.replaceAll(this.dirSeparator, "-");
                rootPath = rootPath.slice(0, rootPath.lastIndexOf("-"));
                dataVals.fullPathId = rootPath;
                dataVals.fullPathIdArr = rootPath.split("-").filter(Boolean);
                
                // Set user input options
                if(genreOption != "") {
                    xmlVals.Genre = genreOption;
                }
                if(title.length > 0) {
                    xmlVals.Title = title;
                }
                if(subTitle.length > 0) {
                    xmlVals.SubTitle = subTitle;
                }
                if(/^\d\d:[0-5]\d:[0-5]\d$/.test(duration)) {
                    curRec.dummyDuration = duration;
                }
                if(filterOption != false) {
                    xmlVals.name = this.filterFileName(fileName, year, filterOption);
                } else {
                    // Do basic sanatising of the name
                    xmlVals.name = fileName;
                }
                
                // If the no data source option was choosen create dummy startTime and endTime
                if(opt == 0) {
                    curRec.setEndTimeProp();
                }
                this.numRecordings++;
                
            } else {
                debugMsg(`[debug] '${blob.name}' is not a video file skipping it`);
            }
        }
    }
    
    // Called From:  this.addRecording()
    // dir:          The user input root directory path
    // Function:     Adds a seperator to the end of this.fullPath if it doesn't have one
    // Return:       The root directory or a defualt string if the user input is invalid
    validateRootDir(dir) {
        debugMsg(`[info] Start validateRootDir(${dir})`);
        if(dir) {
            if(dir.slice(-1) != this.dirSeparator) {
                return dir + this.dirSeparator;
            }
            return dir;
        }
        debugMsg(`[debug] Invalid root dir '${dir}'`);
        return "Library/";
    }
    
    // Called From:  this.addRecording()
    // dir:          A directory/file path
    // Function:     ...
    // Return:       ...
    getDirName(dir) {
        debugMsg(`[info] Start getDirName(${dir})`);
        const dirNameEnd = dir.lastIndexOf(this.dirSeparator);
        dir = dir.substr(0, dirNameEnd);
        
        const dirLen = dir.length;
        let dirNameStart = dir.lastIndexOf(this.dirSeparator) + 1;
        dirNameStart = (dirNameStart > -1) ? dirNameStart : dirNameStart - dirLen;
        dir = dir.substr(dirNameStart);
        
        debugMsg(`[info] End getDirName()`);
        return dir;
    }
    
    // Called From:  this.addRecording()
    // blob          blob.name video.mp4
    // Function:     Checks if a blob with matching properties already exists in the library
    // Return:       True if the blob alreay exists false otherwise
    checkBlobExists(blob) {
        debugMsg(`[info] Start checkBlobExists()`);
        const name = blob.name;
        const relativePath = blob.webkitRelativePath;
        const size = blob.size;
        
        for(let n = 0; n < this.recordings.length; n++) {
            let b = this.recordings[n].blob;
            if(b.name == name && b.webkitRelativePath == relativePath && b.size == size) {
                debugMsg(`[debug] The blob already exists not adding to recordings`);
                return true;
            }
        }
        debugMsg(`[debug] The blob was not found adding it to recordings`);
        return false;
    }
    
    // Called From:  this.addRecording()
    // filename      blob.name video.mp4
    // Function:     Checks the file name string for a valid video mime type
    // Return:       The mime if found or false
    checkMimeTypeStr(filename) {
        debugMsg(`[info] Start checkMimeTypeStr(${filename})`);
        let mimes = [".mp4", ".avi", ".mkv", ".webm", ".flv", "ogg", ".mov", ".wmv", ".rmvb", ".ts"];
        for(let mimeIndex = 0; mimeIndex < mimes.length; mimeIndex++) {
            let strEnd = filename.lastIndexOf(mimes[mimeIndex]);
            if(strEnd > -1) {
                debugMsg(`[debug] Valid file type ${mimes[mimeIndex]}`);
                return mimes[mimeIndex];
            }
        }
        debugMsg(`[debug] Invalid file type`);
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
        debugMsg(`[info] Start getRecordingYear()`);
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
                debugMsg(`[debug] The year '${year}' was found`);
                return year;
            }
        }
        debugMsg(`[debug] A year was not found`);
        return year;
    }
    
    // Called From:  this.addRecording()
    // name          A file name string
    // year          A year YYYY or false if no year found
    // opt           0 = function not called - 1 = Name Only - 2 = Name and (year)
    // Function:     Apply filename filtering based on selected user option
    // Return:       The filtered file name
    filterFileName(name, year, opt) {
        debugMsg(`[info] Starting filterFileName()`);
        // Remove non alphanumeric characters
        name = name.replace(/\./g, " ");
        name = name.replace(/[^a-zA-Z0-9 ]/g, "");
        
        let yearPos = name.lastIndexOf(year);
        if(yearPos > -1) {
            // Remove anything but the name
            name = name.substr(0, yearPos - 1);
            
            // Add the year
            if(opt == 2) {
                name = name + " (" + year + ")";
            }
        // The year was in the directory name but not the file name
        } else if(year && opt == 2) {
            name = name.substr(0, yearPos - 1);
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
        return name;
    }
    
    // Called From:  browser-nativefs.mjs (fileSave)
    // Function:     Creates the XML for each recording
    // Return:       An array with each line of XML
    getRecordingsXML() {
        debugMsg(`[info] Start getRecordingsXML()`);
        let xmlArr = [];
        let recordingsStart = "<recordings>\n";
        let recordingsEnd = "</recordings>";
        xmlArr.push(recordingsStart);
        
        debugMsg(`[info] Setting XML for each recording`);
        for(let n = 0; n < this.numRecordings; n++) {
            xmlArr.push(this.recordings[n].setXml());
        }
        xmlArr.push(recordingsEnd);
        return xmlArr;
    }
}


