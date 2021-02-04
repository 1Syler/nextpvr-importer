class ffmpegData {
    constructor() {
        this.ffmpeg = null;                           // FFmpeg instance
        this.fetchFile = null;                        // FFmpeg object
        this.ffmpegSupport = true;                    // True if the browser supports running FFmpeg
        this.logFFmpegProps = false;                  // True when running FFmpeg
        this.recording = null;                        // The current recording instance running in FFmpeg
        this.propFilters = {                          // Used to filter FFmpeg output
            name: "FS.writeFile ",                    // +13 - Not in use
            startTime: "creation_time   : ",          // +18
            duration: "Duration: "                    // +10
        };
    }
    
    async loadFfmpeg() {
        console.log("here");
        //Initialise FFmpeg
        const { createFFmpeg, fetchFile } = FFmpeg;
        this.ffmpeg = createFFmpeg({ log: false });
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
        await this.ffmpeg.load();
    }
    
    async runFfmpeg(recording, blob) {
        this.logFFmpegProps = true;
        try {
            if(this.ffmpegSupport === true) {
                // Run recordings with FFmpeg to get file details if it hasn't already been checked with FFmpeg
                if(recording.ffmpegStatus == null || recording.ffmpegStatus == false) {
                    try {
                        this.recording = recording;
                        const name = blob.name;
                        
                        this.ffmpeg.FS('writeFile', name, await this.fetchFile(blob));
                        await this.ffmpeg.run("-i", name);
                        this.ffmpeg.FS('unlink', name);
                        recording.ffmpegStatus = true;
                        
                    } catch(err) {
                        recording.ffmpegStatus = false;
                        console.error(`[ERROR] Error couldn't get FFmpeg details for '${blob.name}': ${err}`);
                    }
                }
            } else {
                $("#error-message").css("display", "block");
                $("#error-message").html("You're browser does not support running FFmpeg");
            }
            
        } catch(err) {
            console.error(err);
        }
        this.logFFmpegProps = false;
    }
}
