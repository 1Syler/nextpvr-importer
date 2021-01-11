//Initialise and load FFmpeg
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false });
(async () => {
    await ffmpeg.load();
})();


//Load classes
const template = new recordingsTemplate();
const recordingUi = new recordingUI(template);
template.addUiClass(recordingUi);


// Start checking the files using FFmpeg to get the properties for the recordingTemplate XML
// Called In: browser-nativefs.mjs (directoryOpen)
async function startRecordingFfmpeg(blobs) {
    // When run more than once the recordings need to start after the last recordings
    template.numRecordings = (template.numRecordings + blobs.length);
    template.validateRootDir(template.rootDir);
    
    // Disable buttons adding recordings
    document.getElementById(`run-filter`).disabled = true;
    document.getElementById(`save`).disabled = true;
    document.getElementById(`open-directory`).disabled = true;
    document.getElementById(`dirPath`).disabled = true;
    document.getElementById(`prop-name`).disabled = true;
    document.getElementById(`custom-filter`).disabled = true;
    
    const type = "fferr";
    let logFFmpegProps = true;
    ffmpeg.setLogger(({ type, message }) => {
        // Uncomment to view FFmpeg output
        //console.log(message);
        
        // Only check the logs when adding the recording
        if(logFFmpegProps) {
            //debugMsg("[info] Check the logs for recordingTemplate properties that need to be set");
            if(message.search(template.propFilters.startTime) > -1) {
                //debugMsg("[info] Setting property startTime");
                template.setStartTimeProps(message);
            }
            if(message.search(template.propFilters.duration) > -1) {
                //debugMsg("[info] Setting property duration");
                template.setDurationProp(message);
            }
            // At the end of the recording check set the final properties
            if(message.search("FFMPEG_END") > -1) {
                //debugMsg("[info] Setting property endTime");
                template.setEndTimeProp();
            }
        }
    });
    
    //debugMsg("[info] Starting check of recordings in the opened directory");
    let progNum = 1;
    let maxTries = 3;
    let ffmpegStatus = null;
    $("#progress-indicator").css("display", "block");
    for (const blob of blobs) {
        const filename = blob.name;
        const relativePath = blob.webkitRelativePath;
        const mimeType = template.checkMimeTypeStr(filename);
            
            //debugMsg("[info] Checking if the recording is a video file");
            if(blob.type.startsWith('video/') || mimeType !== false) {
                //debugMsg("[info] Adding new recording to recordingTemplate");
                template.addRecording(blob, relativePath, filename, mimeType);
                
                //debugMsg("[info] Running recording with FFmpeg to get file details");
                let tryNum = 1;
                while(true) {
                    try {
                        ffmpeg.FS('writeFile', filename, await fetchFile(blob));
                        await ffmpeg.run("-i", filename);
                        ffmpeg.FS('unlink', filename);
                        ffmpegStatus = true;
                        break;
                
                    } catch (err) {
                        // try unlinking the file here?
                        
                        
                        if(tryNum == maxTries) {
                            console.log(`[ERROR] Error couldn't get FFmpeg details for '${filename}': ${err}`);
                            ffmpegStatus = false;
                            break;
                        }
                        tryNum++;
                    }
                }
                
                //debugMsg("[info] Creating the directory structure for $[filename}");
                recordingUi.createDirectoryStructure(relativePath, template.recordingCount, ffmpegStatus);
                template.recordingCount++;
            } else {
                //debugMsg("[info] Skipping file because it is not a video");
                template.numRecordings = (template.numRecordings - 1);
            }
        
            //debugMsg("[info] Updating progress bar");
            $("#progress").css("width", Math.floor(100 / blobs.length * progNum) + "%");
            progNum++;
    }
    //debugMsg("[info] Ending check of recordings in the opened directory");
    //debugMsg("[info] Removing progress indicator");
    $("#progress-indicator").css("display", "none");
    $("#progress").css("width", "0%");
    
    //debugMsg(`[info] Enable butons after adding recordings`);
    document.getElementById(`run-filter`).disabled = false;
    document.getElementById(`save`).disabled = false;
    document.getElementById(`open-directory`).disabled = false;
    document.getElementById(`dirPath`).disabled = false;
    document.getElementById(`prop-name`).disabled = false;
    document.getElementById(`custom-filter`).disabled = false;
    
    //debugMsg("[info] Stopping FFmpeg log property checking");
    logFFmpegProps = false;
    
    console.log("[info] printing objects for debugging");
    console.log("[info] ", template);
    console.log("[info] ", recordingUi);
}
