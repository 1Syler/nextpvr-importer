let directory = function() {
    this.dirName = null;        // folder
    this.pathId = null;         // #root-folder-subfolder-etc
    this.prevPathId = null;     // #root-folder-etc
    this.dirId = null;          // A unique directory number ID
    this.numFiles = 0;          // the number files in the directory
    this.numFolders = 0;        // the number of folders in the directory
    this.indent;                // the number of pixels to indent the ui
    
}

let file = function() {
    this.name = null;            // The directory containing the file
    this.filename = null;        // vid.mp4
    this.fileId = null;          // file-panel-{num}
    this.recNum = null;          // The recording number
    this.rating = null;
    
}

class recordingsDirectoryStructure {
    constructor() {
        this.filePathArr = [];      // The file path without the file name split by template.dirSeparator
        this.directories = [];      // A directory instance object for each folder created
        this.files = [];            // A file instance object for each file created
        this.prevId = "";           // The previous directory path before the curernt path
        this.indent = null;
    }
    
    // dirPath: 
    setFilePath(dirPath) {
        debugMsg(`[info] Setting file path for ${dirPath}`);
        try {
            let relativePath = dirPath.replaceAll("/", template.dirSeparator);
            this.filePathArr = relativePath.split(template.dirSeparator).slice(0, -1);
            this.indent = (this.indent == null) ? this.indent = 0 : this.indent = 15;
            
            // Check each part of the file path and create a folder UI if it doesn't exist
            // Create the file UI when the whole path has been checked
            if(this.filePathArr[0]) {
                // Filter the directory name to create the directory id
                // Set the path starting with the first directory in the current path
                // Then add the next part of the path to the current path
                let curId = this.filePathArr[0].replaceAll(/[^a-zA-Z0-9]/g, "");
                let pathId = (this.prevId == "") ? curId : this.prevId + "-" + curId;
                
                // Create the new directory properties amd create the folder UI
                // if the current directory exists check the next part of the path
                if($(`#${pathId}`).length == 0) {
                    debugMsg(`[info] Creating new folder ${pathId} in ${this.prevId}`);
                    let dirCount = this.createDirectoryObj(pathId);
                    
                    debugMsg(`[info] Updating the directory count then adding the folder UI for ${pathId}`);
                    this.updateNumItems("dir", this.prevId);
                    this.addFolderUi(this.directories[dirCount]);
                }
                // Remove the current directory from the path then check the next part
                this.prevId = pathId;
                this.setFilePath(relativePath.slice(relativePath.indexOf(template.dirSeparator) + 1));
                
            } else {
                debugMsg(`[info] Checking if file ${relativePath} exists`);
                if(!this.checkFileExists(this.prevId, relativePath)) {
                    let fileCount = this.files.push(new file) - 1;
                    this.files[fileCount].name = this.prevId;
                    this.files[fileCount].filename = relativePath;
                    this.files[fileCount].fileId = `#file-panel-${this.recNum}`;
                    this.files[fileCount].recNum = this.recNum;
                    
                    debugMsg(`[info] Adding file ${relativePath} to ${this.prevId}`);
                    this.addFileUi(this.prevId);
                    this.updateNumItems("file", this.prevId);
                } else {
                    this.recNum--;
                }
                this.prevId = "";
                this.indent = null;
            }
        
        } catch (err) {
            console.error(`[ERROR] Failed to set the file path for ${relativePath}: ${err}`);
        }
        debugMsg(`[SUCCESS] setFilePath()`);
    }
    
    // pathId: 
    // return: 
    createDirectoryObj(pathId) {
        debugMsg(`[info] Setting path for ${pathId}`);
        try {
            let dirCount = this.directories.push(new directory) - 1;
            this.directories[dirCount].dirName = this.filePathArr[0];
            this.directories[dirCount].dirId = dirCount;
            this.directories[dirCount].pathId = pathId;
            this.directories[dirCount].prevPathId = (this.prevId == "") ?  "#user-output" : "#" + this.prevId;
            this.directories[dirCount].indent = this.indent;
            return dirCount;
            
        } catch (err) {
            console.error(`[ERROR] Error in createDirectoryObj(): ${err}`);
        }
        debugMsg(`[SUCCESS] Path set for ${pathId}`);
    }
    
    // type: "dir" or "file"
    // path: the path id "#path-id
    // return: 
    updateNumItems(type, path) {
        debugMsg(`[info] Incrementing '${type}' number for ${path}`);
        try {
            for(let n = 0; n < this.directories.length; n++) {
                if(this.directories[n].pathId == path) {
                    if(type == "dir") {
                        this.directories[n].numFolders++;
                    } else if (type == "file") {
                        this.directories[n].numFiles++;
                    }
                    debugMsg(`[SUCCESS] Incremented ${type} number for ${path}`);
                    this.updateFolderBadge(this.directories[n], path);
                    return true;
                }
            }
            debugMsg(`[debug] Failed to increment ${type} number for ${path}`);
            return false;
        
        } catch (err) {
            console.error(`[ERROR] Error in updateNumItems(): ${err}`);
        }
    }
    
    // pathId; 
    // name: 
    // return: 
    checkFileExists(pathId, name) {
        debugMsg(`[info] Checking if file ${name} exists in path ID ${pathId}`);
        try {
            for(let n = 0; n < this.files.length; n++) {
                if(this.files[n].name == pathId && this.files[n].filename == name) {
                    debugMsg(`[SUCCESS] ${name} exists`);
                    return true;
                }
            }
            debugMsg(`[debug] ${name} doesn't exists`);
            return false;
        
        } catch (err) {
            console.error(`[ERROR] Error in checkPathExists(): ${err}`);
        }
    }
    
}

class recordingUI extends recordingsDirectoryStructure {
    constructor(template) {
        super();
        this.template = template;
        this.recNum = 0;
        
        // create the file editing UI blank tempate
        this.openFileUi(false);
        
        //
        $(`#run-filter`).click(function() {
            let filter = $("#custom-filter").val();
            let propName = $("#prop-name").val();
            template.runCustomFilter(filter, propName, false);
        });
    }
    
    createDirectoryStructure(dirPath, recNum) {
        debugMsg(`[info] Creating the directory structure for ${dirPath}`);
        try {
            this.recNum = recNum;
            this.setFilePath(template.rootDirName + template.dirSeparator + dirPath);
        
        } catch (err) {
            console.error(`[ERROR] Error in createDirectoryStructure(): ${err}`);
        }
        debugMsg(`[SUCCESS] Directory structure created for ${dirPath}`);
    }
    
    addFolderUi(dir) {
        debugMsg(`[info] Adding folder UI for ${dir.pathId}`);
        try {
            let folderArrowUp = '<i class="fa fa-angle-up float-right adjust-position-arrow"></i>';
            let folderArrowDown = '<i class="fa fa-angle-down float-right adjust-position-arrow"></i>';
            let folderPanel = `
                <div class="panel-group">
                    <div id="${dir.pathId}-panel" class="panel panel-default">
                        <div class="panel-heading">
                            <h4 class="panel-title">
                                <span class="adjust-panel-heading" data-toggle="collapse" href="#collapse${dir.dirId}">
                                    <i class="fa fa-folder mr-4 adjust-position"></i>
                                    <b class="adjust-position" >${dir.dirName}</b>
                                    <span id="${dir.pathId}-badge" class="badge badge-light ml-2">0</span>
                                    <span id="${dir.pathId}-arrow">
                                        <i class="fa fa-angle-up float-right adjust-position-arrow"></i>
                                    </span>
                                </span>
                            </h4>
                        </div>
                        <div id="collapse${dir.dirId}" class="panel-collapse collapse">
                            <div id="${dir.pathId}" class="panel-body">
                                <div id="${dir.pathId}-folders">
                                
                                </div>
                                
                                <div id="${dir.pathId}-files">
                                
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // ..................
            if(dir.prevPathId == "#user-output") {
                $(dir.prevPathId).append(folderPanel);
            } else {
                $(`${dir.prevPathId} ${dir.prevPathId}-folders`).append(folderPanel);
            }
            $(`#${dir.pathId}-panel`).css("margin-left", `${dir.indent}px`);
            
            // ..................
            $(`#collapse${dir.dirId}`).on('show.bs.collapse', function (e) {
                if ($(this).is(e.target)) {
                    $(`#${dir.pathId}-panel #${dir.pathId}-arrow i`).replaceWith(folderArrowDown);
                }
            });
            $(`#collapse${dir.dirId}`).on('hide.bs.collapse', function (e) {
                if ($(this).is(e.target)) {
                    $(`#${dir.pathId}-panel #${dir.pathId}-arrow i`).replaceWith(folderArrowUp);
                }
            });
        
        } catch (err) {
            console.error(`[ERROR] Error in addFolderUi(): ${err}`);
        }
        debugMsg(`[SUCCESS] Folder UI for ${dir.pathId} added`);
    }

    updateFolderBadge(dirObj, pathId) {
        debugMsg(`[info] Incrementing the current number of items in the directory ${pathId}`);
        try {
            let id = "#" + pathId + "-badge";
            let num = dirObj.numFiles + dirObj.numFolders;
            $(id).text(num);
        
        } catch (err) {
            console.error(`[ERROR] Error in updateFolderBadge(): ${err}`);
        }
        debugMsg(`[SUCCESS] Number of items in the directory ${pathId} incremented`);
    }
    
    // pathId: 
    // recNum: 
    // update: 
    addFileUi(pathId, recNum = this.recNum, update) {
        debugMsg(`[info] Adding file panel UI for ${recNum} at ${pathId}`);
        try {
            let ratingUi = `
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
            let statusUi = '<i class="fail-status fa fa-times-circle float-right adjust-position text-danger" title="Failed to add the file"></i>';
            let filePanelUi = `
                <div id="file-panel-${recNum}" class="panel panel-default file-ui-panel">
                    <div class="panel-heading">
                        <h4 class="panel-title">
                            <span class="adjust-panel-heading">
                                <i class="fa fa-file mr-4 adjust-position"></i>
                                <b style="font-size: 15px;" class="adjust-position">${template.recordings[recNum].recordingXmlVals.name}</b>
                                
                                <i id="file-panel-${recNum}-edit" class="fa fa-edit float-right ml-3 adjust-position"></i>
                                ${(template.recordings[recNum].status) ? ratingUi : statusUi}
                            </span>
                        </h4>
                    </div>
                </div>
            `;
            
            // ...........................
            if($(`#file-panel-${recNum}`).length == 0) {
                $(`#user-output .panel #${pathId}-files`).append(filePanelUi);
            }
            
            // ...........................
            if(update) {
                $(`#user-output .panel ${pathId}`).replaceWith(filePanelUi);
            }
            
            // ............................
            $(`#file-panel-${recNum}-edit`).click(function() {
                recordingUi.openFileUi(recNum);
            });
        
        } catch (err) {
            console.error(`[ERROR] Error in addFileUi(): ${err}`);
        }
        debugMsg(`[SUCCESS] File panel UI for ${recNum} at ${pathId} added`);
    }
    
    // recNum: The current recording number or false if adding the default HTML
    openFileUi(recNum) {
        debugMsg(`[info] Adding file UI for ${recNum}`);
        try {
            let index = (recNum === false) ? "default" : recNum;
            let props = (template.recordings[recNum]) ? template.recordings[recNum].recordingXmlVals : false;
            let fileUi = `
                <div id="recording-${index}" class="recording-file-ui px-3 pt-3">
                    <div class="row">
                        <div class="col-lg-3 mb-3">
                            <img id="vid-artwork-img" src="./img/artwork_placeholder.png" alt="..." class="img-thumbnail mb-3">
                            <button id="recording-${index}-play" type="button" class="btn btn-danger btn-sm mb-2 disabled">Play</button>
                            <button id="recording-${index}-edit" type="button" class="btn btn-info btn-sm mb-2" disabled>Edit</button>
                            <button id="recording-${index}-save" type="button" class="btn btn-success btn-sm" disabled>Save</button>
                        </div>
                        
                        <div class="col-lg-9">
                            <div id="recording-${index}-data">
                                <div class="row">
                                    <div class="col-lg-4 mb-2"><span><b>Start Time:</b></span></div>
                                    <div class="data-edit col-lg-8 mb-2">
                                        <span id="recording-${index}-startTime">${(props) ? props.startTime : ""}</span>
                                    </div>
                                    <div class="col-lg-4 mb-2"><span><b>End Time:</b></span></div>
                                    <div class="data-edit col-lg-8 mb-2">
                                        <span id="recording-${index}-endTime">${(props) ? props.endTime : ""}</span>
                                    </div>
                                    <div class="col-lg-4 mb-2"><span><b>File Path:</b></span></div>
                                    <div class="data-edit col-lg-8 mb-2">
                                        <span id="recording-${index}-fullPath">${(props) ? props.fullPath : ""}</span>
                                    </div>
                                    <div class="col-lg-4 mb-2"><span><b>Name:</b></span></div>
                                    <div class="data-edit col-lg-8 mb-2">
                                        <span id="recording-${index}-name">${(props) ? props.name : ""}</span>
                                    </div>
                                    <div class="col-lg-4 mb-2"><span><b>Title:</b></span></div>
                                    <div class="data-edit col-lg-8 mb-2">
                                        <span id="recording-${index}-Title">${(props) ? props.Title : ""}</span>
                                    </div>
                                    <div class="col-lg-4 mb-2"><span><b>Sub Title:</b></span></div>
                                    <div class="data-edit col-lg-8 mb-2">
                                        <span id="recording-${index}-SubTitle">${(props) ? props.SubTitle : ""}</span>
                                    </div>
                                    <div class="col-lg-4 mb-2"><span><b>Genre:</b></span></div>
                                    <div class="data-edit col-lg-8 mb-2">
                                        <span id="recording-${index}-Genre">${(props) ? props.Genre : ""}</span>
                                    </div>
                                    <div class="col-lg-4 mb-2"><span><b>Year:</b></span></div>
                                    <div class="data-edit col-lg-8 mb-2">
                                        <span id="recording-${index}-year">${(props) ? props.year : ""}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if(index !== "default") {
                $(`#recording-editor>div`).replaceWith(fileUi);
                $(`#recording-${index}-edit`).prop('disabled', false);
                $(`#recording-${index}-save`).prop('disabled', false);
                
                $(`#recording-${index}-play`).click(function() {
                    //recordingUi.playRecording(index);
                });
                $(`#recording-${index}-edit`).click(function() {
                    recordingUi.editRecording(index);
                });
                $(`#recording-${index}-save`).click(function() {
                    recordingUi.saveRecording(index);
                });
            } else {
                $("#recording-editor").append(fileUi);
            }
        
        } catch (err) {
            console.error(`[ERROR] Error in openFileUi(): ${err}`);
        }
        debugMsg(`[SUCCESS] File UI for ${(recNum) ? recNum : 'default'} added`);
    }
    
    editRecording(recNum) {
        debugMsg(`[info] Editing recording number ${recNum}`);
        try {
            let dataId = `recording-${recNum}-data`;
            document.querySelectorAll(`#${dataId} .data-edit span`).forEach(function(dataStr) {
                let input = document.createElement("input");
                let dataId = $(dataStr).attr('id');
                
                $(input).val(dataStr.innerHTML);
                $(input).addClass("form-control form-control-sm");
                $(input).css("color", "black");
                $(input).attr('id', dataId);
                dataStr.replaceWith(input);
            });
        
        } catch (err) {
            console.error(`[ERROR] Error in editRecording(): ${err}`);
        }
        debugMsg(`[SUCCESS] Rcording number ${recNum} edited`);
    }
    
    saveRecording(recNum) {
        debugMsg(`[info] Saving recording number ${recNum}`);
        try {
            let dataId = `recording-${recNum}-data`;
            let recProps = template.recordings[recNum].recordingXmlVals;
            
            document.querySelectorAll(`#${dataId} .data-edit input`).forEach(function(dataInput) {
                let span = document.createElement("span");
                
                if($(dataInput).attr('id') == `recording-${recNum}-startTime`) {
                    recProps.startTime = $(dataInput).val();
                }
                else if($(dataInput).attr('id') == `recording-${recNum}-endTime`) {
                    recProps.endTime = $(dataInput).val();
                }
                else if($(dataInput).attr('id') == `recording-${recNum}-fullPath`) {
                    recProps.fullPath = $(dataInput).val();
                }
                else if($(dataInput).attr('id') == `recording-${recNum}-name`) {
                    recProps.name = $(dataInput).val();
                }
                else if($(dataInput).attr('id') == `recording-${recNum}-Title`) {
                    recProps.Title = $(dataInput).val();
                }
                else if($(dataInput).attr('id') == `recording-${recNum}-SubTitle`) {
                    recProps.SubTitle = $(dataInput).val();
                }
                else if($(dataInput).attr('id') == `recording-${recNum}-Genre`) {
                    recProps.Genre = $(dataInput).val();
                }
                else if($(dataInput).attr('id') == `recording-${recNum}-year`) {
                    recProps.year = $(dataInput).val();
                }
                
                span.textContent = $(dataInput).val();
                dataInput.replaceWith(span);
            });
        
        } catch (err) {
            console.error(`[ERROR] Error in saveRecording(): ${err}`);
        }
        debugMsg(`[SUCCESS] Recording number ${recNum} saved`);
    }
    
    async playRecording(recNum) {
        debugMsg(`[info] Playing recording number ${recNum}`);
        try {
            let blob = template.recordings[recNum].blob
            let filename = blob.name;
            ffmpeg.FS('writeFile', filename, await fetchFile(blob));
            await ffmpeg.run('-i', blob.name,  'output.mp4');
            const data = ffmpeg.FS('readFile', 'output.mp4');
            const video = document.getElementById('player');
            video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
                
        }  catch (err) {
            console.error(`[ERROR] Error in playRecording(): ${err}`);
        }
        debugMsg(`[SUCCESS] Recording number ${recNum} played`);
    }
}

