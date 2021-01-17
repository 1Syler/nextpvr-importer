class directory {
    constructor(pathId, dirId, dirName) {
        this.dirId = dirId;                                      // A unique directory number ID
        this.pathId = pathId;                                    // root-folder-subfolder-etc
        this.prevPathId = this.setPreviousDirectoryId(pathId);   // root-folder-subfolder
        this.dirName = dirName;                                  // etc
        this.numFiles = 0;                                       // the number files in the directory
        this.numFolders = 0;                                     // the number of folders in the directory
        this.files = []                                          // An array of recording belonging to this folder
    }
    
    // ...
    setDirNameId(pathId) {
        return pathId.slice(pathId.lastIndexOf("-") + 1)
    }
    
    // Incremnt the number of folder in this directory
    updateNumFolders() {
        this.numFolders++;
    }
    
    // Called From:  ...
    // pathId:         ..
    // Function:     ..
    // Return:       ...
    setPreviousDirectoryId(pathId) {
        const strEnd = pathId.lastIndexOf("-");
        return (strEnd > -1) ? pathId.slice(0, strEnd) : "";
    }
    
    // Called From:  ...
    // file:         ..
    // Function:     ..
    // Return:       ...
    addFile(recording) {
        for(const file of this.files) {
            if(recording.idNum == file.idNum) {
                return false;
            }
        }
        this.files.push(recording)
        this.numFiles++;
        return true;
    }
}

class recordingsDirectoryStructure {
    constructor() {
        this.directories = [];
        this.dirId = 0;
        
        // Add an event listner to the run filter button 
        // that is enabled one the user library is created
        $(`#run-filter`).click(function() {
            let filter = $("#custom-filter").val();
            let propName = $("#prop-name").val();
            template.runCustomFilter(filter, propName, false);
        });
    }

    // Called From:  ...
    // recordings:         ..
    // Function:     ..
    // Return:       ...
    async createDirectories(recordings) {
        // Check each recording
        for(const recording of recordings) {
            const recPathId = recording.recordingData.fullPathId;
            
            // Check if a directory with the full path already exists
            let dir = this.getDirectory(recPathId);
            if(dir === false) {
                let pathId = "";
                let prevPathId = "";
                
                // Check each part of the recording path
                let pathCount = 0;
                for(const path of recording.recordingData.fullPathIdArr) {
                    pathId = (pathId == "") ? path : pathId + "-" + path;
                    
                    //create the directory if it doesn't exist
                    dir = this.getDirectory(pathId);
                    if(dir === false) {
                        this.directories.push(new directory(pathId, this.dirId, recording.recordingData.fullPathArr[pathCount]));
                        this.dirId++;
                        
                        // Increment the number of folders for the previous folder
                        if(prevPathId != "") {
                            this.getDirectory(prevPathId).updateNumFolders();
                        }
                    }
                    pathCount++;
                    prevPathId = pathId;
                }
            }
            this.getDirectory(recPathId).addFile(recording);
        }
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
    
    // Called From:  ...
    // dirArr:         ..
    // Function:     ..
    // Return:       ...
    getAllDirectories(dirArr) {
        let pathId = "";
        let dirCount = 0;
        let dirs = [];
        
        for(let n = 0; n < dirArr.length; n++) {
            pathId = (pathId == "") ? dirArr[n] : pathId + "-" + dirArr[n];
            
            for(let m = 0; m < this.directories.length; m++) {
                if(this.directories[m].pathId == pathId) {
                    dirs.push(this.directories[m]);
                    break;
                }
            }
        }
        return dirs;
    }
}

class recordingUi extends recordingsDirectoryStructure {
    // Called From:  file://browser-nativefs.js
    // dirs:         false - When setting all the directories without an additional data source
    // Called From:  file://start-recording-ffmpeg.js
    // dirs:         [] - The directories in the path of the current recording runnung in FFmpeg
    // Function:     Creates the directory UI for the given directories
    // Return:       None
    createDirUi(dirs, file) {
        // If no directories passed load all directories
        if(dirs === false) {
            dirs = this.directories;
        }
        
        const dirLen = dirs.length;
        let dirCount = 1;
        for(const directory of dirs) {
            if($(`#${directory.pathId}`).length == 0) {
                const folderArrowUp = '<i class="fa fa-angle-up float-right adjust-position-arrow"></i>';
                const folderArrowDown = '<i class="fa fa-angle-down float-right adjust-position-arrow"></i>';
                const folderPanel = `
                    <div class="panel-group">
                        <div id="${directory.pathId}-panel" class="panel panel-default">
                            <div class="panel-heading">
                                <h4 class="panel-title">
                                    <span class="adjust-panel-heading" data-toggle="collapse" href="#collapse${directory.dirId}">
                                        <i class="fa fa-folder mr-4 adjust-position"></i>
                                        <b class="adjust-position" >${directory.dirName}</b>
                                        <span id="${directory.pathId}-badge" class="badge badge-light ml-2">
                                        ${directory.numFiles + directory.numFolders}
                                        </span>
                                        <span id="${directory.pathId}-arrow">
                                            <i class="fa fa-angle-up float-right adjust-position-arrow"></i>
                                        </span>
                                        <span id="${directory.pathId}-select-folder">
                                            <i class="fa fa-check-circle float-right adjust-position-arrow pr-3"></i>
                                        </span>
                                    </span>
                                </h4>
                            </div>
                            <div id="collapse${directory.dirId}" class="panel-collapse collapse">
                                <div id="${directory.pathId}" class="panel-body">
                                    <div id="${directory.pathId}-folders">
                                    
                                    </div>
                                    
                                    <div id="${directory.pathId}-files">
                                    
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // If it is the root directory no previous directory will be set and it doesn't need indenting
                if(directory.prevPathId == "") {
                    $(`#user-output`).append(folderPanel);
                } else {
                    $(`#${directory.prevPathId} #${directory.prevPathId}-folders`).append(folderPanel);
                    $(`#${directory.pathId}-panel`).css("margin-left", `15px`);
                }
                
                const selectIcon = $(`#${directory.pathId}-panel #${directory.pathId}-select-folder i`);
                $(`#${directory.pathId}-panel #${directory.pathId}-select-folder i`).click(function(event) {
                    if ($(this).is(event.target)) {
                        (selectIcon.css("color") == "rgb(255, 255, 255)") ? selectIcon.css("color", "green") : selectIcon.css("color", "white");
                        event.stopPropagation();
                    }
                });
                
                // When bootstrap collapse event is triggered change the arrow UI
                $(`#collapse${directory.dirId}`).on('show.bs.collapse', function(event) {
                    if ($(this).is(event.target)) {
                        $(`#${directory.pathId}-panel #${directory.pathId}-arrow i`).replaceWith(folderArrowDown);
                    }
                });
                $(`#collapse${directory.dirId}`).on('hide.bs.collapse', function(event) {
                    if ($(this).is(event.target)) {
                        $(`#${directory.pathId}-panel #${directory.pathId}-arrow i`).replaceWith(folderArrowUp);
                    }
                });
            }
            
            // Create all files in the directory or just the file that was passed
            if (file === false) {
                this.createFileUi(directory.files, directory.pathId);
            } else if(dirCount == dirLen) {
                this.createFileUi(file, directory.pathId);
            }
            dirCount++;
        }
    }
    
    // Called From:  this.createDirUi
    // directory:    All the files in the given directory
    // Called From:  file://start-recording-ffmpeg.js - this.createDirUi
    // directory:    [] - The current file running in runnung in FFmpeg
    // Function:     Creates the File UI for the given file/s
    // Return:       None
    createFileUi(files, pathId) {
        for(const file of files) {
            const statusUi = '<i class="fail-status fa fa-times-circle float-right adjust-position text-danger" title="Failed to add the file"></i>';
            const ratingUi = `
                <div class="rating float-right adjust-position">
                    <input type="radio" name="rating" value="1" id="1">
                    <label for="1">☆</label>
                    <input type="radio" name="rating" value="2" id="2">
                    <label for="2">☆</label>
                    <input type="radio" name="rating" value="3" id="3">
                    <label for="3">☆</label>
                    <input type="radio" name="rating" value="4" id="4">
                    <label for="4">☆</label>
                    <input type="radio" name="rating" value="5" id="5">
                    <label for="5">☆</label>
                </div>
            `;
            const filePanelUi = `
                <div id="file-panel-${file.idNum}" class="panel panel-default file-ui-panel">
                    <div class="panel-heading">
                        <h4 class="panel-title">
                            <span class="adjust-panel-heading">
                                <i class="fa fa-file mr-4 adjust-position"></i>
                                <b style="font-size: 15px;" class="adjust-position">${file.recordingXmlVals.name}</b>
                                
                                <i id="file-panel-${file.idNum}-edit" class="fa fa-edit float-right ml-3 adjust-position"\ 
                                    data-toggle="modal" data-target="#file-modal"></i>
                                ${(file.ffmpegStatus == false) ? statusUi : ratingUi}
                            </span>
                        </h4>
                    </div>
                </div>
            `;
            
            // If the file panel doesn't exist then add it
            if($(`#file-panel-${file.idNum}`).length == 0) {
                $(`#user-output .panel #${pathId}-files`).append(filePanelUi);
            } else {
                $(`#user-output .panel #${pathId}-files #file-panel-${file.idNum}`).replaceWith(filePanelUi);
            }
            
            // Set a click handler for the file edit button
            const _self = this;
            $(`#file-panel-${file.idNum}-edit`).click(function() {
                _self.openFileUi(file);
            });
        }
    }
    
    // Called From:  Event handler in this.createFileUi()
    // file:         ..
    // Function:     ..
    // Return:       None
    openFileUi(file) {
        let fileUi = `
            <div id="recording-${file.idNum}" class="recording-file-ui p-3">
                <div class="row">
                    <div class="col-lg-3">
                        <img id="vid-artwork-img" src="./img/artwork_placeholder.png" alt="..." class="img-thumbnail mb-3">
                        <button id="recording-${file.idNum}-play" type="button" class="btn btn-danger btn-sm mb-2 disabled">Play</button>
                        <button id="recording-${file.idNum}-edit" type="button" class="btn btn-info btn-sm mb-2" disabled>Edit</button>
                        <button id="recording-${file.idNum}-save" type="button" class="btn btn-success btn-sm" disabled>Save</button>
                    </div>
                    
                    <div class="col-lg-9">
                        <div id="recording-${file.idNum}-data">
                            <div class="row">
                                <div class="col-lg-3 mb-2"><span><b>Start Time:</b></span></div>
                                <div class="data-edit col-lg-9 mb-2">
                                    <span id="recording-${file.idNum}-startTime">${file.recordingXmlVals.startTime}</span>
                                </div>
                                <div class="col-lg-3 mb-2"><span><b>End Time:</b></span></div>
                                <div class="data-edit col-lg-9 mb-2">
                                    <span id="recording-${file.idNum}-endTime">${file.recordingXmlVals.endTime}</span>
                                </div>
                                <div class="col-lg-3 mb-2"><span><b>File Path:</b></span></div>
                                <div class="data-edit col-lg-9 mb-2">
                                    <span id="recording-${file.idNum}-filename">${file.recordingXmlVals.filename}</span>
                                </div>
                                <div class="col-lg-3 mb-2"><span><b>Name:</b></span></div>
                                <div class="data-edit col-lg-9 mb-2">
                                    <span id="recording-${file.idNum}-name">${file.recordingXmlVals.name}</span>
                                </div>
                                <div class="col-lg-3 mb-2"><span><b>Title:</b></span></div>
                                <div class="data-edit col-lg-9 mb-2">
                                    <span id="recording-${file.idNum}-Title">${file.recordingXmlVals.Title}</span>
                                </div>
                                <div class="col-lg-3 mb-2"><span><b>Sub Title:</b></span></div>
                                <div class="data-edit col-lg-9 mb-2">
                                    <span id="recording-${file.idNum}-SubTitle">${file.recordingXmlVals.SubTitle}</span>
                                </div>
                                <div class="col-lg-3 mb-2"><span><b>Genre:</b></span></div>
                                <div class="data-edit col-lg-9 mb-2">
                                    <span id="recording-${file.idNum}-Genre">${file.recordingXmlVals.Genre}</span>
                                </div>
                                <div class="col-lg-3 mb-2"><span><b>Year:</b></span></div>
                                <div class="data-edit col-lg-9 mb-2">
                                    <span id="recording-${file.idNum}-year">${file.recordingData.year}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        //
        $(`#recording-editor`).html(fileUi);
        $(`#recording-${file.idNum}-edit`).prop('disabled', false);
        $(`#recording-${file.idNum}-save`).prop('disabled', false);
        
        //
        const _self = this;
        $(`#recording-${file.idNum}-play`).click(function() {
            //_self.playRecording(file);
        });
        $(`#recording-${file.idNum}-edit`).click(function() {
            _self.editRecording(file);
        });
        $(`#recording-${file.idNum}-save`).click(function() {
            _self.saveRecording(file);
        });
    }
    
    // Called From:  Event handler in this.openFileUi()
    // file:         ..
    // Function:     ..
    // Return:       None
    editRecording(file) {
        let dataId = `recording-${file.idNum}-data`;
        document.querySelectorAll(`#${dataId} .data-edit span`).forEach(function(dataStr) {
            let input = document.createElement("input");
            let dataId = $(dataStr).attr('id');
            
            $(input).val(dataStr.innerHTML);
            $(input).addClass("form-control form-control-sm");
            $(input).css("color", "black");
            $(input).attr('id', dataId);
            dataStr.replaceWith(input);
        });
    }
    
    // Called From:  Event handler in this.openFileUi()
    // file:         ..
    // Function:     ..
    // Return:       None
    saveRecording(file) {
        let dataId = `recording-${file.idNum}-data`;
        let recProps = file.recordingXmlVals;
        
        document.querySelectorAll(`#${dataId} .data-edit input`).forEach(function(dataInput) {
            let span = document.createElement("span");
            let propId = $(dataInput).attr('id');
            propId = propId.replace(/recording-\d*-/, "");
            
            recProps[propId] = $(dataInput).val();
            span.textContent = $(dataInput).val();
            dataInput.replaceWith(span);
        });
    }
    
    async playRecording(recNum) {
        let blob = template.recordings[recNum].blob
        let filename = blob.name;
        ffmpeg.FS('writeFile', filename, await fetchFile(blob));
        await ffmpeg.run('-i', blob.name,  'output.mp4');
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const video = document.getElementById('player');
        video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    }
}


