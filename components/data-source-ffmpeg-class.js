class ffmpegData {
    constructor() {
        this.ffmpeg = null;                           // FFmpeg instance
        this.fetchFile = null;                        // FFmpeg object
        this.logFFmpegProps = false;                  // True when running FFmpeg
        this.recording = null;                        // The current recording instance running in FFmpeg
        this.propFilters = {                          // Used to filter FFmpeg output
            name: "FS.writeFile ",                    // +13 - Not in use
            startTime: "creation_time   : ",          // +18
            duration: "Duration: "                    // +10
        };
    }
    
    async loadFfmpeg() {
        if(this.ffmpeg == null) {
            //Initialise FFmpeg
            const { createFFmpeg, fetchFile } = FFmpeg;
            this.ffmpeg = createFFmpeg({ log: false });
            this.fetchFile = fetchFile;
            const type = "ffinfo";
            
            this.ffmpeg.setLogger(({ type, message }) => {
                // Uncomment to view FFmpeg output
                //console.log(message);
                
                // Only check the logs when adding the recording
                if(this.logFFmpegProps) {
                    if(message.search(this.propFilters.startTime) > -1) {
                        this.recording.setStartTimeProps(message, this.propFilters.startTime);
                    }
                    if(message.search(this.propFilters.duration) > -1) {
                        this.recording.setDurationProp(message, this.propFilters.duration);
                    }
                    if(message.search("FFMPEG_END") > -1) {
                        // At the end of the recording check the startTime and duration property
                        // If they are null set them and set endTime final properties
                        this.recording.setEndTimeProp();
                    }
                }
            });
            await this.ffmpeg.load();
        }
    }
    
    async runFfmpeg(recordings, recordingDirectories) {
        this.setButtonState(true);
        this.logFFmpegProps = true;
        let progNum = 0;
        let numRecs = recordings.length;
        $("#progress-indicator").css("display", "block");
        
        $(".progress-bar-title").html(`<span id="file-progress">FFmpeg Loading...</span>`);
        await this.loadFfmpeg();
        
        for(const recording of recordings) {
            $("#progress").css("width", Math.floor(100 / numRecs * progNum) + "%");
            $(".progress-bar-title").html(`FFmpeg checking file: <span id="file-progress">${recording.recordingXmlVals.name}</span>`);
            
            debugMsg("[info] Running recording with FFmpeg to get file details");
            if(recording.ffmpegStatus == null || recording.ffmpegStatus == false) {
                try {
                    this.recording = recording;
                    let blob = recording.blob;
                    let name = blob.name;
                    
                    this.ffmpeg.FS('writeFile', name, await this.fetchFile(blob));
                    await this.ffmpeg.run("-i", name);
                    this.ffmpeg.FS('unlink', name);
                    recording.ffmpegStatus = true;
                    
                } catch (err) {
                    recording.setEndTimeProp();
                    recording.ffmpegStatus = false;
                    console.error(`[ERROR] Error couldn't get FFmpeg details for '${recording.blob.name}': ${err}`);
                }
                let dirArr = recordingDirectories.getAllDirectories(recording.recordingData.fullPathIdArr);
                recordingDirectories.createDirUi(dirArr, [recording]);
                progNum++;
            }
        }
        this.setButtonState(false);
        this.logFFmpegProps = false;
        $("#progress-indicator").css("display", "none");
        $("#progress").css("width", "0%");
    }
    
    // Disable buttons when adding recordings enable them again after
    setButtonState(state) {
        document.getElementById(`run-filter`).disabled = state;
        document.getElementById(`save`).disabled = state;
        document.getElementById(`open-directory`).disabled = state;
        document.getElementById(`dirPath`).disabled = state;
        document.getElementById(`prop-name`).disabled = state;
        document.getElementById(`custom-filter`).disabled = state;
    }
}

