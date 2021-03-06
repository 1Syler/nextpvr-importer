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
        this.prevFolder = [];                                    // An array with an instance of the previous folder
        this.selected = false;                                   // True if the folder has been selected by the user
        this.firstRun = true;                                    // False when the directory UI has already been created
        
        this.seriesDetails = {
            "isSeries": false,                                   //
            "name": dirName,                                     //
            "seasons": [],                                       //
            "numSeasons": 0,                                     //
            "lastDirId": 0                                       //
        }
    }
    
    // Called From:  constructor()
    // pathId:       The current path ID
    // Function:     Slice off the last part of the path ID to get the previous directory
    // Return:       The previous directory ID
    setPreviousDirectoryId(pathId) {
        const strEnd = pathId.lastIndexOf("-");
        return (strEnd > -1) ? pathId.slice(0, strEnd) : "";
    }
    
    // Called From:  recordingsLibrary - addRecordings()
    // Function:     Increment the number of folder in this directory
    updateNumFolders() {
        this.numFolders++;
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
                a = a.recordingXmlVals.title;
                b = b.recordingXmlVals.title;
                
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
    constructor(idNum, year, fileType, fileSize, fileMime, relativePath, fullPathId, ufn, fullPath, Genre, title, subtitle, dummyDuration) {
        this.idNum = idNum;                    // A unique recording number
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
            fileSize: fileSize,                // blob.size
            filenameMime: fileMime,            // .avi
            unfilteredFileName: ufn            // The blob.name without any chnages
        }
        
        this.recordingXmlVals = {
            oid: "",                           //
            channel: "User-Library",           // A constant channel name
            filename: fullPath,                // /home/me/folder/myvid.avi
            name: "",                          // myvid - filters may apply
            status: "READY",                   // A constant status string
            startTime: "",                     // YYYY-MM-DDTHH:MM:SS.00Z
            endTime: "",                       // YYYY-MM-DDTHH:MM:SS.00Z
            EventStart: "",                    //
            OID: "",                           //
            title: title,                      //
            subtitle: subtitle,                //
            Description: "",                   //
            ChannelOID: "",                    //
            StartTime: "",                     //
            EndTime: "",                       //
            FirstRun: "",                      //
            OriginalAirDate: "",               //
            GenresStart: "",                   //
            Genre: Genre,                      //
            UniqueID: `User-Library${idNum}`,  // A unique ID to avoid duplication
            EventEnd: "",                      //    THIS MAY BE NOT BE NEED AS IT IT JUST A TAG
            recordingEnd: ""                   //
        };
    }
    
    // Called From:  recordingsLibrary - addRecordings()
    // Function:     Apply file name filtering based on selected user option
    filterFileName() {
        const year = this.recordingData.year;
        let name = this.recordingXmlVals.title;
        // Remove non alphanumeric characters
        name = name.replace(/\./g, " ");
        name = name.replace(/[^a-zA-Z0-9 ]/g, "");
        
        let yearPos = name.lastIndexOf(year);
        if(yearPos > -1) {
            // Remove anything but the name
            name = name.substr(0, yearPos);
            
            // Add the year
            name = name + " (" + year + ")";
            
        // The year was in the directory name not the file name
        } else if(year) {
            name = name.substr(0, yearPos);
            name = name + " (" + year + ")";
        }
        
        //Remove appended junk
        const junkFilters = [
            "DVDRip", "BrRip", "BDRip", "HDRip", "HDTV", "PDTV", "BluRay", "WEBRip", "WEB-HD", "WEB", "400p", "480p", "540p", "720p", "1080p", 
            "x264", "x265", "Xvid", "AC3"//, " (", "(", " [", "[", " {", "{"
        ];
        for(const filter of junkFilters) {
            const nameStr = name.toLowerCase();
            const filterPos = nameStr.lastIndexOf(filter.toLowerCase());
            if(filterPos > -1) {
                name = name.substr(0, filterPos - 1);
            }
        }
        // Remove prepended junk
        //name = name.replace(/.*[ ]{2,}/, "");
        this.recordingXmlVals.title = name.trim();
    }
    
    // Called From:  file://data-source-ffmpeg-class.js - loadFfmpeg()
    // message:      FFmpeg logger output string when the startTime property is found
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Sets the recording properties startTime, startTimeDate and startTimeDuration
    //               If FFmpeg was not used or didn't find the startTime property the current date is used
    setStartTimeProps(message, filter) {
        let startIndex = 0;
        
        // Create startTime property if not found
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
    
    // Called From:  file://data-source-ffmpeg-class.js - loadFfmpeg()
    // message:      FFmpeg logger output string when duration property is found
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Sets the recording duration property, if FFmpeg was not used or didn't find
    //               the duration property the default or user input duration is used
    setDurationProp(message, filter) {
        let startIndex = 0;
        
        // Add default or user input duration if not found
        if(message === false) {
            message = this.dummyDuration;
        } else {
            startIndex = message.search(filter) + 10;
        }
        
        this.recordingData.duration = message.substr(startIndex, 8);
    }
    
    // Called From:  file://data-source-ffmpeg-class.js - loadFfmpeg()
    // message:      FFmpeg logger output when a file has been checked and unlinked
    // Called From:  this.setEndTimeProp()
    // message:      false
    // Function:     Checks if the startTime and duration properties have been set and
    //               sets them if they are not. Sets the recording endTime property
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
    
    encodeXML(xmlStr) {
        const encodedStr = xmlStr.replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;');
        return encodedStr;
    }
    
    // Called From:  recordingsLibrary - getRecordingsXML()
    // Function:     Creates the XML string from the recordings properties
    // Return:       The XML string
    // https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references
    // https://stackoverflow.com/questions/730133/what-are-invalid-characters-in-xml
    setXml() {
        let recordingXML = `
            <recording>
            <oid>${this.recordingXmlVals.oid}</oid>
            <channel>${this.recordingXmlVals.channel}</channel>
            <filename>${this.encodeXML(this.recordingXmlVals.filename)}</filename>
            <status>${this.recordingXmlVals.status}</status>
            <startTime>${this.recordingXmlVals.startTime}</startTime>
            <endTime>${this.recordingXmlVals.endTime}</endTime>
            <OID>${this.recordingXmlVals.OID}</OID>
            <title>${this.encodeXML(this.recordingXmlVals.title)}</title>
            <subtitle>${this.encodeXML(this.recordingXmlVals.subtitle)}</subtitle>
            <Description>${this.encodeXML(this.recordingXmlVals.Description)}</Description>
            <ChannelOID>${this.recordingXmlVals.ChannelOID}</ChannelOID>
            <StartTime>${this.recordingXmlVals.StartTime}</StartTime>
            <EndTime>${this.recordingXmlVals.EndTime}</EndTime>
            <FirstRun>${this.recordingXmlVals.FirstRun}</FirstRun>
            <OriginalAirDate>${this.recordingXmlVals.OriginalAirDate}</OriginalAirDate>
            <Genres>
            <Genre>${this.encodeXML(this.recordingXmlVals.Genre)}</Genre>
            </Genres>
            <UniqueID>${this.recordingXmlVals.UniqueID}</UniqueID>
            </recording>
        `;
        return recordingXML;
    }
}

class recordingsLibrary {
    constructor() {
        this.idNum = 0;                  // A unique ID for the library
        this.libraryName = null             // Last part of this.fullPath
        this.userInput = {};                // An object of user input paramters
        this.directories = [];              // An array of directory class instances
        this.numDirectories = 0;            // The current directory number
        this.recordings = [];               // An array of all recording class instances in this library
        this.numRecordings = 0;             // The current recording number
        this.seasonCheckedFolders = 0;      // The directory ID number of the last checked folder
        
        this.stringToRegex = str => {
            // Main regex
            const main = str.match(/\/(.+)\/.*/)[1];
            // Regex options
            const options = str.match(/\/.+\/(.*)/)[1];
            // Compiled regex
            return new RegExp(main, options);
        }
        
        // These filter will be searched in a loop removing anything in the string that comes after the filter
        this.junkFilters = [
            "DVDRip", "BrRip", "BDRip", "HDRip", "HDTV", "BluRay", "WEBRip", "WEB-HD", "WEB", "400p", "480p", "720p", "1080p", 
            "x264", "x265", "Xvid", "AC3"//, " (", "(", " [", "[", " {", "{"
        ];
        
        // These filter will only be removed if they are at the end of the string
        this.realWordFilters = [
            "/INTERNAL$/gi", "/PROPER$/gi", "/REAL$/gi"
        ]
        
        this.dirFilters = [
            "/season/i",
            "/seasons/i",
            "/series/i",
            "/complete/i",
            "/the complete/i",
            "/s[0-9]{2}/i"
        ];
        
        this.subDirFilters = [
            "/season/i",
            "/episodes/i",
            "/^[0-9]$/"
        ];
        
        this.fileFilters = [
            "/s[0-9]{2}e[0-9]{2}/i",               // s01e01
            "/s[0-9]{2} e[0-9]{2}/i",              // s01 e01
            "/s[0-9]e[0-9]{2}/i",                  // s1e01
            "/s[0-9]{2}e[0-9]/i",                  // s01e1
            "/s[0-9] e[0-9]{2}/i",                 // s1 e01
            "/s[0-9]{2} e[0-9]/i",                 // s01 e1
            "/s[0-9] e[0-9]/i",                    // s1 e1
            "/[0-9]{2}x[0-9]{2}/i",                // 01x01
            "/[0-9]x[0-9]{2}/i",                   // 1x01
            "/[0-9]x[0-9]/i",                      // 1x1
            "/season [0-9] episode [0-9]/i",       // season 1 episode 1
            "/season [0-9]{2} episode [0-9]{2}/i", // season 10 episode 10
            "/season[0-9] episode[0-9]/i",         // season1 episode1
            "/episode [0-9]{2}/i",                 // episode 1
            "/episode[0-9]/i",                     // episode1
            "/part [0-9]/i",                       // part 1
            "/part[0-9]/i",                        // part1
            "/[0-9]{4}/",                          // 1111 - Check that it doesn't match a year string
            "/^[0-9]{3} /",                        // 101
            "/^[0-9]{2} - /",                      // 01 - - At the begining of the string
            "/^[0-9]{2} /",                        // 01 - At the begining of the string
            "/^[0-1][0-9]{2}-/",                   // 001- 
            "/[0-9] [0-9]{2}/i",                   // 1 01
            "/[0-9] [0-9]/i"                       // 1 1
        ];
        
        this.dirPatterns = [ // NEED TO CONVERT TO ONE REGEX STRING
            "/ season.*/gi",
            "/ seasons.*/gi",
            "/ series.*/gi",
            "/ the complete.*/gi",
            "/ complete.*/gi",
            "/ s[0-9]{2}.*/gi",
            "/ \\(season.*/gi",
            "/ \\(seasons.*/gi",
            "/ \\(series.*/gi",
            "/ \\(the complete.*/gi",
            "/ \\(complete.*/gi",
            "/ \\(s[0-9]{2}.*/gi",
            "/ \\[season.*/gi",
            "/ \\[seasons.*/gi",
            "/ \\[series.*/gi",
            "/ \\[the complete.*/gi",
            "/ \\[complete.*/gi",
            "/ \\[s[0-9]{2}.*/gi",
            "/season.*/gi",
            "/seasons.*/gi",
            "/series.*/gi",
            "/the complete.*/gi",
            "/complete.*/gi",
            "/s[0-9]{2}.*/gi",
            "/\\(season.*/gi",
            "/\\(seasons.*/gi",
            "/\\(series.*/gi",
            "/\\(the complete.*/gi",
            "/\\(complete.*/gi",
            "/\\(s[0-9]{2}.*/gi",
            "/\\[season.*/gi",
            "/\\[seasons.*/gi",
            "/\\[series.*/gi",
            "/\\[the complete.*/gi",
            "/\\[complete.*/gi",
            "/\\[s[0-9]{2}.*/gi",
        ];
    }
    
    // Called In:
    // name
    filterSeriesName(name, prevPathId) {
        // Get the previous directory name for the series name
        // if the current folders are named origional or remake
        if(/^origional$/i.test(name) || /^remake$/i.test(name)) {
            name = this.getDirectory(prevPathId).dirName + " " + name;
        }
        // Remove non alphanumeric characters
        let filteredName = name.replace(/\./g, " ");
        
        for(const pattern of this.dirPatterns) {
            filteredName = filteredName.replace(this.stringToRegex(pattern), "");
        }
        return filteredName.trim();
    }
    
    // Called In:
    // name
    filterSeasonDirName(name, seasons) {
        let seasonNums = name.match(/season [0-9]{1,2}|season[0-9]{1,2}/i);
        if(seasonNums != null) {
            seasonNums[0] = seasonNums[0].replace(/[^0-9]/g, "")
        } else {
            seasonNums = name.match(/[0-9]{1,2}/g);
        }
        
        if(seasonNums != null) {
            for(let n = 0; n < seasonNums.length; n++) {
                if(!seasons.includes(seasonNums[n])) {
                    return "Season " + parseInt(seasonNums[n], 10);
                }
            }
        } else {
            return false;
        }
    }
    
    // Called In:
    // name
    filterEpisodeName(name, seriesName, dirName) {
        // Remove the file extension
        const fileMime = this.checkMimeTypeStr(name);
        let episode = name.substr(0, name.lastIndexOf(fileMime));
        
        // Remove non alphanumeric characters
        episode = episode.replace(/\./g, " ");
        episode = episode.replace(/_/g, " ");
        episode = episode.replace(/[^a-zA-Z0-9-', ]/g, "");
        const nameStr = episode.toLowerCase();
        
        for(const filter of this.junkFilters) {
            const filterPos = nameStr.lastIndexOf(filter.toLowerCase());
            if(filterPos > -1) {
                episode = episode.substr(0, filterPos - 1);
            }
        }
        
        // Remove some real words if they are at the end of the name
        for(const filter of this.realWordFilters) {
            const filterPos = episode.search(this.stringToRegex(filter));
            if(filterPos > -1) {
                episode = episode.substr(0, filterPos);
            }
        }
        
        let nameRegEx = this.stringToRegex(`/^${seriesName} /i`);
        let seriesNamePos = episode.search(nameRegEx);
        if(seriesNamePos > -1) {
            episode = episode.substr(seriesName.length);
        } else {
            seriesName = seriesName.replace("&", "and");
            nameRegEx = this.stringToRegex(`/^${seriesName} /i`);
            seriesNamePos = episode.search(nameRegEx);
            
            if(seriesNamePos > -1) {
                episode = episode.substr(seriesName.length);
            }
        }
        
        episode = episode.trim();
        
        for(const filter of this.fileFilters) {
            if(this.stringToRegex(filter).test(episode)) {
                const filterStart = episode.search(this.stringToRegex(filter));
                
                if(filter === "/s[0-9]{2}e[0-9]{2}/i") { // Default string make uppercase
                    let episodeStr = episode.substr(filterStart, 6).toUpperCase();
                    
                    if(episode[filterStart + 6] == '-') {
                        episode = episode.replace(this.stringToRegex(filter), `${episodeStr} `);
                    } else{
                        episode = episode.replace(this.stringToRegex(filter), episodeStr);
                    }
                } else if(filter === "/s[0-9]{2} e[0-9]{2}/i") {
                    const seasonNum = episode.substr(filterStart + 1, 2);
                    const episodeNum = episode.substr(filterStart + 5, 2);
                    
                    if(episode[filterStart + 7] == '-') {
                        episode = episode.replace(this.stringToRegex(filter), `S${seasonNum}E${episodeNum} `);
                    } else{
                        episode = episode.replace(this.stringToRegex(filter), `S${seasonNum}E${episodeNum}`);
                    }
                } else if(filter === "/s[0-9]{2}e[0-9]/i") {
                    const seasonNum = episode.substr(filterStart + 1, 2);
                    const episodeNum = episode.substr(filterStart + 5, 1);
                    
                    if(episode[filterStart + 6] == '-') {
                        episode = episode.replace(this.stringToRegex(filter), `S${seasonNum}E0${episodeNum} `);
                    } else{
                        episode = episode.replace(this.stringToRegex(filter), `S${seasonNum}E0${episodeNum}`);
                    }
                } else if(filter === "/s[0-9]e[0-9]{2}/i") {
                    const seasonNum = episode.substr(filterStart + 1, 1);
                    const episodeNum = episode.substr(filterStart + 4, 2);
                    
                    if(episode[filterStart + 6] == '-') {
                        episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E${episodeNum} `);
                    } else{
                        episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E${episodeNum}`);
                    }
                } else if(filter === "/s[0-9] e[0-9]/i") {
                    const seasonNum = episode.substr(filterStart + 1, 1);
                    const episodeNum = episode.substr(filterStart + 4, 1);
                    
                    if(episode[filterStart + 5] == '-') {
                        episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E0${episodeNum} `);
                    } else{
                        episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E0${episodeNum}`);
                    }
                } else if(filter === "/season [0-9]{2} episode [0-9]{2}/i") {
                    const seasonNum = episode.substr(filterStart + 8, 2);
                    const episodeNum = episode.substr(filterStart + 19, 2);
                    
                    if(episode[filterStart + 21] == '-') {
                        episode = episode.replace(this.stringToRegex(filter), `S${seasonNum}E${episodeNum} `);
                    } else{
                        episode = episode.replace(this.stringToRegex(filter), `S${seasonNum}E${episodeNum}`);
                    }
                } else if(filter === "/season [0-9] episode [0-9]/i") {
                    const seasonNum = episode.substr(filterStart + 8, 1);
                    const episodeNum = episode.substr(filterStart + 18, 1);
                    
                    if(episode[filterStart + 19] == '-') {
                        episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E0${episodeNum} `);
                    } else{
                        episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E0${episodeNum}`);
                    }
                } else if(filter === "/[0-9]{2}x[0-9]{2}/i") {
                    const seasonNum = episode.substr(filterStart, 2);
                    const episodeNum = episode.substr(filterStart + 3, 2);
                    
                    if(episode[filterStart + 5] == '-') {
                        episode = episode.replace(this.stringToRegex(filter), `S${seasonNum}E${episodeNum} `);
                    } else{
                        episode = episode.replace(this.stringToRegex(filter), `S${seasonNum}E${episodeNum}`);
                    }
                } else if(filter === "/[0-9]x[0-9]{2}/i") {
                    const seasonNum = episode.substr(filterStart, 1);
                    const episodeNum = episode.substr(filterStart + 2, 2);
                    episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E${episodeNum}`);
                } else if(filter === "/[0-9] [0-9]{2}/i") {
                    const seasonNum = episode.substr(filterStart, 1);
                    const episodeNum = episode.substr(filterStart + 2, 2);
                    episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E${episodeNum}`);
                } else if(filter === "/[0-9] [0-9]/i") {
                    const seasonNum = episode.substr(filterStart, 1);
                    const episodeNum = episode.substr(filterStart + 2, 1);
                    episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E0${episodeNum}`);
                } else if(filter === "/[0-9]{4}/") {
                    const startFilter = "/^[0-9]{4}/";
                    const filterStart = episode.search(this.stringToRegex(startFilter));
                    
                    if(this.stringToRegex(startFilter).test(episode)) {
                        const episodeStr = episode.substr(filterStart, 4);
                        
                        if(this.getRecordingYear([episodeStr]) === false) {
                            const seasonNum = episode.substr(filterStart, 2);
                            const episodeNum = episode.substr(filterStart + 2, 2);
                            episode = episode.replace(this.stringToRegex(startFilter), `S${seasonNum}E${episodeNum}`);
                        }
                    } else {
                        continue;
                    }
                } else if(filter === "/part [0-9]/i") {
                    let seasonNum = dirName.replace(/[^0-9]/g, "");
                    (seasonNum.length === 1) ? seasonNum = `S0${seasonNum}` : `S${seasonNum}`;
                    
                    if(seasonNum !== "") {
                        const episodeNum = episode.substr(filterStart + 5, 1);
                        episode = episode.replace(this.stringToRegex(filter), `${seasonNum}E0${episodeNum}`);
                    }
                } else if(filter === "/episode [0-9]{2}/i") {
                    let seasonNum = dirName.replace(/[^0-9]/g, "");
                    (seasonNum.length === 1) ? seasonNum = `S0${seasonNum}` : `S${seasonNum}`;
                    
                    if(seasonNum !== "") {
                        const episodeNum = episode.substr(filterStart + 8, 2);
                        episode = episode.replace(this.stringToRegex(filter), `${seasonNum}E${episodeNum}`);
                    }
                } else if(filter === "/^[0-9]{2} /") {
                    let seasonNum = dirName.replace(/[^0-9]/g, "");
                    (seasonNum.length === 1) ? seasonNum = `S0${seasonNum}` : `S${seasonNum}`;
                    
                    if(seasonNum !== "") {
                        const episodeNum = episode.substr(filterStart, 2);
                        episode = episode.replace(this.stringToRegex(filter), `${seasonNum}E${episodeNum}`);
                    }
                } else if(filter === "/^[0-9]{2} - /") {
                    let seasonNum = dirName.replace(/[^0-9]/g, "");
                    (seasonNum.length === 1) ? seasonNum = `S0${seasonNum}` : `S${seasonNum}`;
                    
                    if(seasonNum !== "") {
                        const episodeNum = episode.substr(filterStart, 2);
                        episode = episode.replace(this.stringToRegex(filter), `${seasonNum}E${episodeNum} `);
                    }
                } else if(filter === "/^[0-1][0-9]{2}-/") {
                    let seasonNum = dirName.replace(/[^0-9]/g, "");
                    (seasonNum.length === 1) ? seasonNum = `S0${seasonNum}` : `S${seasonNum}`;
                    
                    if(seasonNum !== "") {
                        const episodeNum = parseInt(episode.substr(filterStart, 2), 10);
                        episode = episode.replace(this.stringToRegex(filter), `${seasonNum}E${episodeNum} `);
                    }
                } else if(filter === "/^[0-9]{3} /") {
                    const seasonNum = episode.substr(filterStart, 1);
                    const episodeNum = episode.substr(filterStart + 1, 2);
                    episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E${episodeNum}`);
                } else if(filter === "/[0-9]x[0-9]/i") {
                    const seasonNum = episode.substr(filterStart, 1);
                    const episodeNum = episode.substr(filterStart + 2, 1);
                    episode = episode.replace(this.stringToRegex(filter), `S0${seasonNum}E0${episodeNum}`);
                } else {
                    console.log("Filter: " + filter + " Name: " + episode);
                }
                break;
            } else {
                //console.log("No filter found for: " + episode);
            }
        }
        
        return episode.trim();
    }
    
    // Called In:
    // dir
    getLastDirId(dir) {
        if(dir.subFolders.length === 0) {
            return dir.dirId;
        } else {
            return this.getLastDirId(dir.subFolders[dir.subFolders.length - 1]);
        }
    }
    
    // Called In:
    // dir
    setSeriesDetails(dir) {
        dir.seriesDetails.isSeries = true;
        dir.seriesDetails.lastDirId = this.getLastDirId(dir);
        const seriesName = this.filterSeriesName(dir.seriesDetails.name, dir.prevPathId);
        dir.seriesDetails.name = seriesName;
        let curSeasonDir = 0;
        
        // Check the series folder for season folders
        if(dir.subFolders.length > 0) {
            let foundSeasons = [];
            
            // Create a season folder object
            for(const seasonDir of dir.subFolders) {
                // Set the season folder name
                let dirName = this.filterSeasonDirName(seasonDir.dirName, foundSeasons);
                // If no season identifier was found in the name set it as the current name
                // Otherwise add it to the season array to avoid duplicate seasons
                (dirName === false) ? dirName = seasonDir.dirName : foundSeasons.push(dirName.replace(/[^0-9]/g, ""));
                dir.seriesDetails.seasons.push({
                    "dirId": seasonDir.dirId,
                    "dirName": dirName,
                    "episodes": {}
                });
                
                // Set the seasons file list
                // If the season folder contains all files
                curSeasonDir = dir.seriesDetails.seasons.length - 1;
                if(seasonDir.files.length > 0) {
                    for(const file of seasonDir.files) {
                        const idNum = file.idNum;
                        const fileName = this.filterEpisodeName(file.recordingData.unfilteredFileName, seriesName, dirName);
                        dir.seriesDetails.seasons[curSeasonDir].episodes[idNum] = fileName;
                        file.recordingXmlVals.title = dir.seriesDetails.name;
                        file.recordingXmlVals.subtitle = fileName;
                    }
                }
                
                // If the season directory contains any folders
                if(seasonDir.subFolders.length > 0) {
                    for(const fileDir of seasonDir.subFolders) {
                    
                        // If each directory contains 1 episode
                        if(fileDir.files.length === 1) {
                            const idNum = fileDir.files[0].idNum;
                            const fileName = this.filterEpisodeName(fileDir.files[0].recordingData.unfilteredFileName, 
                                seriesName, dirName);
                            dir.seriesDetails.seasons[curSeasonDir].episodes[idNum] = fileName;
                            fileDir.files[0].recordingXmlVals.title = dir.seriesDetails.name;
                            fileDir.files[0].recordingXmlVals.subtitle = fileName;
                        
                        // A directory contains all the episodes
                        } else {
                            if(this.checkSeasonFiles(fileDir.files)) {
                                for(const file of fileDir.files) {
                                    const idNum = file.idNum;
                                    const fileName = this.filterEpisodeName(file.recordingData.unfilteredFileName, 
                                        seriesName, dirName);
                                    dir.seriesDetails.seasons[curSeasonDir].episodes[idNum] = fileName;
                                    file.recordingXmlVals.title = dir.seriesDetails.name;
                                    file.recordingXmlVals.subtitle = fileName;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // If the series folder contains possible episode files
        if(dir.files.length > 0) {
            dir.seriesDetails.seasons.push({
                "dirId": this.numDirectories,
                "dirName": "Season 1",
                "episodes": {}
            });
            curSeasonDir = dir.seriesDetails.seasons.length - 1;
            this.numDirectories++;
            dir.seriesDetails.seasons["Season 1"] = {};
            
            for(const file of dir.files) {
                const idNum = file.idNum;
                const fileName = this.filterEpisodeName(file.recordingData.unfilteredFileName, seriesName, "Season 1");
                dir.seriesDetails.seasons[curSeasonDir].episodes[idNum] = fileName;
                file.recordingXmlVals.title = dir.seriesDetails.name;
                file.recordingXmlVals.subtitle = fileName;
            }
        }
        
        console.log(dir);
        // Skip the dertection past the last sub directory in this series directory
        this.seasonCheckedFolders = dir.seriesDetails.lastDirId;
    }
    
    getFileSeason() {
        
    }
    
    // Called In:
    // 
    detectSeries(dir, blobs) {
        // Skip any folders in the last series that was found
        if(dir.dirId > this.seasonCheckedFolders) {
            if(dir.subFolders.length > 0) {
                const subFolder = this.checkSeasonSubFolders(dir);
                if(subFolder !== false) {
                    if(this.checkSeasonFiles(subFolder.files)) {
                        this.setSeriesDetails(dir);
                        return true;
                    }
                } else {
                    //console.log("Not a season " + dir.dirName);
                }
                
            // If the directory doesn't contain any season directories
            // check if it has episode files instead
            } else if(dir.files.length > 0) {
                if(this.checkSeasonFiles(dir.files)) {
                    this.setSeriesDetails(dir);
                    return true;
                }
            }
        }
        return false;
    }
    
    // Called In:
    // dir
    checkSeasonSubFolders(dir) {
        if(dir.subFolders.length > 0) {
            // Check the each sub directory for a season folder
            for(const seasonFolder of dir.subFolders) {
                for(const seasonFilter of this.subDirFilters) {
                
                    if(this.stringToRegex(seasonFilter).test(seasonFolder.dirName) && seasonFolder.files.length > 0) {
                        return seasonFolder;
                    }
                }
            }
        }
        return false;
    }
    
    // Called In:
    // dir
    checkSeasonFiles(files) {
        // File names with 'part x' should have more than 2 parts to be a series
        let numPartFiles = 0;
        // Season strings used if the filter [0-9]{4} is matched as additional verification is needed
        let seasonNum = [];
        // Episode strings used if the filter ^[0-9]{2}||{3} is matched as additional verification is needed
        // The numbers are checked to make sure they are sequential it is valid if there are 4 or more
        // sequential numbers in the folder
        let digit2episodeNum = null;
        let sequence2Num = 0;
        let digit3episodeNum = null;
        let sequence3Num = 0;
        
        for(const file of files) {
            let fileName = file.recordingData.unfilteredFileName;
            
            for(const fileFilter of this.fileFilters) {
                // Check for file name strings including 'part x'
                if(this.stringToRegex(fileFilter).test(fileName) && fileFilter.includes("part")) {
                    if(this.getRecordingYear([fileName]) === false) {
                        numPartFiles++;
                    }
                    
                // Verify that the string is valid season+episode string
                } else if(this.stringToRegex(fileFilter).test(fileName) && fileFilter === "/[0-9]{4}/") {
                    const filterStart = fileName.search(this.stringToRegex(fileFilter));
                    const seasonStr = fileName.substr(filterStart, 2);
                    const episodeStr = fileName.substr(filterStart + 2, 2);
                    const fullStr = fileName.substr(filterStart, 4);
                    
                    // Add the season string to the array if it doesn't exist
                    if(!seasonNum.includes(seasonStr)) {
                        seasonNum.push(seasonStr);
                        
                    // If the season string already exists and it does not match a year string
                    } else if(seasonNum.includes(seasonStr) && this.getRecordingYear([fullStr]) === false) {
                        return true;
                    }
                    
                // verify that the string is a valid episode string
                } else if(this.stringToRegex(fileFilter).test(fileName) && fileFilter === "/^[0-9]{2} /") {
                    if(this.getRecordingYear([fileName]) === false) {
                        const episodeStr = parseInt(fileName.substr(0, 2));
                        if(digit2episodeNum == null) {
                            digit2episodeNum = episodeStr;
                            sequence2Num = 1;
                        } else if(digit2episodeNum - 1 == episodeStr || digit2episodeNum + 1 == episodeStr) {
                            digit2episodeNum = episodeStr;
                            sequence2Num++;
                        }
                    }
                    
                // verify that the string is a valid season+episode string
                } else if(this.stringToRegex(fileFilter).test(fileName) && fileFilter === "/^[0-9]{3} /") {
                    if(this.getRecordingYear([fileName]) === false) {
                        const episodeStr = parseInt(fileName.substr(0, 3));
                        if(digit3episodeNum == null) {
                            digit3episodeNum = episodeStr;
                            sequence3Num = 1;
                        } else if(digit3episodeNum - 1 == episodeStr || digit3episodeNum + 1 == episodeStr) {
                            digit3episodeNum = episodeStr;
                            sequence3Num++;
                        }
                    }
                    
                } else if(this.stringToRegex(fileFilter).test(fileName) && !fileFilter.includes("part")) {
                    return true;
                }
            }
        }
        // If no other filter match but there are more than 2 'part x' files
        // If no other filter match but there are more than 4 '^[0-9]{2}||{3} ' files
        if(numPartFiles > 2 || sequence2Num > 4 || sequence3Num > 4) {
            return true;
        }
        return false;
    }
    
    // Called From:  file://importer-tool.js - createLibrary()
    // blob:         A recording file blob
    // Function:     Add a recording to the library and create its folder and file structure
    // Return:       A directory instance or path id for a file if no new directory needs to be created
    //               False if the recording was not a video file
    async addRecording(blob, userInput, idNum) {
        // Set the user input values object
        this.userInput = userInput;
        // Set the library name
        const pathArr = userInput.fullPath.split(userInput.dirSeparator).filter(Boolean);
        this.libraryName = pathArr[pathArr.length-1];
        
        // Get the blobs file properties
        const blobFound = this.checkBlobExists(blob);
        const fileType = blob.type;
        const fileSize = blob.size;
        const fileMime = this.checkMimeTypeStr(blob.name);
        const unfilteredFileName = blob.name;
        const title = blob.name.substr(0, blob.name.lastIndexOf(fileMime));
        const relativePath = blob.webkitRelativePath.replaceAll("/", userInput.dirSeparator);
        
        // If the blob doesn't already exist in the library and it is a video file add it
        if(!blobFound && (fileType.startsWith('video/') || fileMime != false)) {
            const recPathId = this.getPathId(this.libraryName, relativePath, userInput.dirSeparator);
            const recPathIdArr = recPathId.split("-").filter(Boolean);
            let recPathArr = `${this.libraryName}${userInput.dirSeparator}${relativePath}`;
            recPathArr = recPathArr.split(userInput.dirSeparator).filter(Boolean);
            
            let dirName = null;                // The unfiltered directory name
            let newDirectory = false;          // The first new directory that is created
            let pathId = "";                   //
            let prevPathId = "";               //
            let pathCount = 0;                 //
            
            // Check if a directory with the full path already exists
            if(this.getDirectory(recPathId) === false) {
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
                            this.getDirectory(pathId).prevFolder.push(this.getDirectory(prevPathId));
                            this.getDirectory(prevPathId).subFolders.push(this.getDirectory(pathId));
                            this.getDirectory(prevPathId).updateNumFolders();
                        }
                    }
                    pathCount++;
                    prevPathId = pathId;
                }
            }
            // If no new directories were created set dirName as the current directory
            if(dirName == null) {
                dirName = recPathArr[recPathArr.length - 2];
            }
            
            // Extract a year (YYYY) from the file or directory name if it has one
            const year = this.getRecordingYear([title, dirName]);
            // Create a new recording instance and add the file to the directory
            this.recordings.push(new recordingFile (
                this.numRecordings,
                year,
                fileType,
                fileSize,
                fileMime,
                relativePath,
                recPathId,
                unfilteredFileName,
                `${userInput.fullPath}${relativePath}`,
                userInput.genreOption,
                title,
                userInput.subTitle,
                userInput.dummyDuration
            ));
            const recording = this.recordings[this.numRecordings];
            this.getDirectory(recPathId).addFile(recording);
            
            // Filter the file name if the user has choosen a filter option
            if(userInput.formatMovies === true) {
                recording.filterFileName();
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
            let recData = this.recordings[n].recordingData;
            if(recData.unfilteredFileName == name && recData.relativePath == relativePath && recData.fileSize == size) {
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
        const mimes = [".mp4", ".avi", ".mkv", ".webm", ".flv", "ogg", ".mov", ".wmv", ".rmvb", ".ts", ".m4v", ".divx",
        ".mpg", ".3gp"];
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
        // Get the library path without the file name
        const libraryPath = libraryName + dirSeparator
        + relativePath.slice(0, relativePath.lastIndexOf(dirSeparator));
        // Remove any id spearator characters '-'
        let libraryPathId = libraryPath.replaceAll("-", "");
        // Replace all directory separator with the id seperator
        libraryPathId = libraryPathId.replaceAll(dirSeparator, "-");
        // Remove all non alphanumeric character except the id separator
        libraryPathId = libraryPathId.replace(/[^a-zA-z0-9-]/g, "");
        
        return libraryPathId;
    }
    
    // Called From:  ...
    // relativePath:         ..
    // Function:     ..
    // Return:       ...
    getRecording(relativePath) {
        for(let n = 0; n < this.recordings.length; n++) {
            if(this.recordings[n].recordingData.relativePath == relativePath) {
                return this.recordings[n];
            }
        }
        return false;
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
    // strArr        An array containing string/s to search for a year value
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
        const xmlAttr = '<?xml version="1.0" encoding="UTF-8"?>'
        const recordingsStart = "<recordings>\n";
        const recordingsEnd = "</recordings>";
        let xmlArr = [];
        xmlArr.push(xmlAttr);
        xmlArr.push(recordingsStart);
        
        // Set XML for each recording
        for(let n = 0; n < this.numRecordings; n++) {
            xmlArr.push(this.recordings[n].setXml());
        }
        xmlArr.push(recordingsEnd);
        return xmlArr;
    }
}

