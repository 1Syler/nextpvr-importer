class ffmpegData {
    constructor() {
        this.ffmpeg = null;                           // FFmpeg instance
        this.fetchFile = null;                        // FFmpeg object
        this.ffmpegSupport = null;                    // True if the browser supports running FFmpeg
        this.logFFmpegProps = false;                  // True when running FFmpeg
        this.recording = null;                        // The current recording instance running in FFmpeg
        
        this.propFilters = {                          // Used to filter FFmpeg output for file information
            name: "FS.writeFile ",                    // +13 - Not in use
            startTime: "creation_time   : ",          // +18
            duration: "Duration: "                    // +10
        };
        this.errorFilters = {                                // Used to filter FFmpeg output for possibly corrupted files
            1: "Invalid data found when processing input",   // +13 - Not in use
            2: "moov atom not found",                        // +18
            3: "error reading header",                       // +10
            4: "Invalid sample size",                        //
            5: "misdetection possible!",                     //
            6: "CTTS invalid",                               //
            7: "EBML header parsing failed"                  //
        };
    }
    
    async loadFfmpeg() {
        //Initialise FFmpeg
        try {
            const { createFFmpeg, fetchFile } = FFmpeg;
            this.ffmpeg = createFFmpeg({ log: false });
            await this.ffmpeg.load();
            this.fetchFile = fetchFile;
            const type = "ffinfo";
            
            this.ffmpeg.setLogger(({ type, message }) => {
                // Uncomment to view FFmpeg output
                console.log(message);
                
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
        } catch(err) {
            this.ffmpegSupport = false;
            console.error(err);
        }
        
        if(this.ffmpegSupport === false) {
            $("#error-message").css("display", "block");
            $("#error-message").html("You're browser does not support running FFmpeg");
        }
    }
    
    async runFfmpeg(recording, blob) {
        this.logFFmpegProps = true;
        if(this.ffmpegSupport == null || this.ffmpegSupport === true) {
            try {
                // Run recordings with FFmpeg to get file details
                try {
                    this.recording = recording;
                    const name = blob.name;
                    
                    this.ffmpeg.FS('writeFile', name, await this.fetchFile(blob));
                    await this.ffmpeg.run("-i", name);
                    this.ffmpeg.FS('unlink', name);
                    
                } catch(err) {
                    console.error(`[ERROR] Error couldn't get FFmpeg details for '${blob.name}': ${err}`);
                }
            } catch(err) {
                this.ffmpegSupport = false;
                console.error(err);
            }
        }
        
        if(this.ffmpegSupport === false) {
            $("#error-message").css("display", "block");
            $("#error-message").html("You're browser does not support running FFmpeg");
        }
        this.logFFmpegProps = false;
    }
}
