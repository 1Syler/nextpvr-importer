class recordingsUi {
    constructor() {
        this.placeHolder = null;
    }
    
    //
    /*createSavedLibrariesUi(libraries) {
        for(const library of libraries) {
            const libraryUi = `
                <div class="mt-2 container-fluid" style="background: black; padding: 15px; border-radius: 5px; border: solid 1px cornflowerblue;">
                    <div class="row">
                        <div style="color: white;" class="col-lg-6">
                            ${library.libraryName} - <i>Contains ${library.numRecordings} recordings</i>
                        </div>
                        <div style="color: white;" class="col-lg-3 offset-lg-3 text-right">
                            <button type="button" id="${library.libraryName}-${library.numRecordings}"\
                             class="btn btn-primary btn-sm text-right">Open Library</button>
                        </div>
                    </div>
                </div>
            `;
            $("#library-box").append(libraryUi);
            
            const _self = this;
            $(`#${library.libraryName}-${library.numRecordings}`).click(async function(event) {
                //importer.library = library;
                _self.loadSavedLibrary(library);
            });
        }
    }
    
    // Called From:  file://recording-ui-class.js - createSavedLibrariesUi() event listner
    // library       A saved recordingsLibrary instance
    // Function:     Creates a recordings library UI from a saved library
    async loadSavedLibrary(library) {
        $(`#user-output`).html("");
        for(const directory of library.directories) {
            if($(`#${directory.pathId}`).length == 0) {
                await this.createDirUi(directory);
            }
            for(const file of directory.files) {
                this.createFileUi(file, directory.pathId);
            }
        }
    }*/
    
    // Called From:  file://importer-tool.js - createLibrary() & loadLibrary()
    // dir:          A recording directory instance
    // Function:     Creates the directory UI for the given directory and sub directories
    async createDirUi(dir) {
        const folderArrowUp = `<i class="fa fa-angle-up float-right adjust-position-arrow" data-toggle="collapse" href="#collapse${dir.dirId}"></i>`;
        const folderArrowDown = `<i class="fa fa-angle-down float-right adjust-position-arrow" data-toggle="collapse" href="#collapse${dir.dirId}"></i>`;
        const folderPanel = `
            <div class="panel-group">
                <div id="${dir.pathId}-panel" class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title">
                            <span class="adjust-panel-heading">
                                <i class="fa fa-folder mr-4 adjust-position"></i>
                                <b class="adjust-position" >${dir.dirName}</b>
                                <span id="${dir.pathId}-badge" class="badge badge-light ml-2">
                                ${dir.numFiles + dir.numFolders}
                                </span>
                                <span id="${dir.pathId}-arrow">
                                    <i class="fa fa-angle-up float-right adjust-position-arrow" data-toggle="collapse" href="#collapse${dir.dirId}"></i>
                                </span>
                                <span id="${dir.pathId}-select-folder">
                                    <i class="fa fa-check-circle float-right adjust-position-arrow pr-3"></i>
                                </span>
                                <span id="${dir.pathId}-open-series">
                                    
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
        
        // If it is the root directory no previous directory will be set and it doesn't need indenting
        if(dir.prevPathId == "") {
            $(`#user-output`).append(folderPanel);
        } else {
            $(`#${dir.prevPathId} #${dir.prevPathId}-folders`).append(folderPanel);
            $(`#${dir.pathId}-panel`).css("margin-left", `15px`);
        }
        
        const _self = this;
        $(`#${dir.pathId}-panel #${dir.pathId}-select-folder i`).click(function(event) {
            if ($(this).is(event.target)) {
                const selectIcon = $(`#${dir.pathId}-panel #${dir.pathId}-select-folder i`);
                const isSelected = selectIcon.css("color") == "rgb(0, 128, 0)";
                _self.selectDirectories([dir], isSelected);
            }
        });
        
        // When bootstrap collapse event is triggered change the arrow UI
        $(`#collapse${dir.dirId}`).on('show.bs.collapse', function(event) {
            if ($(this).is(event.target)) {
                $(`#${dir.pathId}-panel #${dir.pathId}-arrow i`).replaceWith(folderArrowDown);
            }
        });
        $(`#collapse${dir.dirId}`).on('hide.bs.collapse', function(event) {
            if ($(this).is(event.target)) {
                $(`#${dir.pathId}-panel #${dir.pathId}-arrow i`).replaceWith(folderArrowUp);
            }
        });
        
        // Create any sub directories recursively
        for(const sDir of dir.subFolders) {
            this.createDirUi(sDir);
        }
    }
    
    // Called From:  ...
    // file:         ...
    // pathId:       ...
    // Function:     ...
    selectDirectories(directory, isSelected) {
        const selectIcon = $(`#${directory[0].pathId}-panel #${directory[0].pathId}-select-folder i`);
        if(isSelected == false) {
            selectIcon.css("color", "green");
            directory[0].selected = true;
        } else {
            selectIcon.css("color", "white");
            directory[0].selected = false;
        }
        
        for(const dir of directory) {
            for(const subDirs of dir.subFolders) {
                this.selectDirectories([subDirs], isSelected);
            }
        }
    }
    
    // Called From:  this.createDirUi
    // file:         A recording file instance
    // pathId:       The path #(id) of the file
    // Function:     Creates the File UI for the given file
    createFileUi(file, pathId) {
        const filePanelUi = `
            <div id="file-panel-${file.idNum}" class="panel panel-default file-ui-panel">
                <div class="panel-heading">
                    <h4 class="panel-title">
                        <span class="adjust-panel-heading">
                            <i class="fa fa-file mr-4 adjust-position"></i>
                            <b style="font-size: 15px;" class="adjust-position">${file.recordingXmlVals.name}</b>
                            
                            <i id="file-panel-${file.idNum}-edit" class="fa fa-edit float-right ml-3 adjust-position"\ 
                                data-toggle="modal" data-target="#file-modal"></i>
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
    
    // Called From:  Event handler in this.createFileUi()
    // file:         ..
    // Function:     ..
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
    editRecording(file) {
        const dataId = `recording-${file.idNum}-data`;
        document.querySelectorAll(`#${dataId} .data-edit span`).forEach(function(dataStr) {
            const dataId = $(dataStr).attr('id');
            let input = document.createElement("input");
            
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
    saveRecording(file) {
        const dataId = `recording-${file.idNum}-data`;
        const recProps = file.recordingXmlVals;
        document.querySelectorAll(`#${dataId} .data-edit input`).forEach(function(dataInput) {
            const eleId = $(dataInput).attr('id');
            const propId = eleId.replace(/recording-\d*-/, "");
            let span = document.createElement("span");
            
            recProps[propId] = $(dataInput).val();
            $(span).text($(dataInput).val());
            $(span).attr('id', eleId);
            dataInput.replaceWith(span);
        });
    }
    
    /*async playRecording(recNum) {
        let blob = template.recordings[recNum].blob
        let filename = blob.name;
        ffmpeg.FS('writeFile', filename, await fetchFile(blob));
        await ffmpeg.run('-i', blob.name,  'output.mp4');
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const video = document.getElementById('player');
        video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    }*/
    
    addSeriesFolderIcon(dir) {
        const seriesIcon = `<i style="color: chartreuse;" class="fa fa-list-alt float-right adjust-position-arrow pr-3"\
        data-toggle="modal" data-target="#series-modal" aria-hidden="true"></i>`;
        $(`#${dir.pathId}-open-series`).html(seriesIcon);
        
        const _self = this;
        $(`#${dir.pathId}-panel #${dir.pathId}-open-series i`).click(function(event) {
            _self.openSeriesUi(dir);
        });
    }
    
    // Called From:  Event handler in this.createFileUi()
    // file:         ..
    // Function:     ..
    async openSeriesUi(dir) {
        let seriesUi = `
            <div id="recording-series-${dir.dirId}" class="recording-series-ui p-3">
                <h1>${dir.seriesDetails.name}</h1>
            </div>
        `;
        $(`#series-editor`).html(seriesUi);
        
        for(const seasonDir of dir.seriesDetails.seasons) {
            const dirName = seasonDir.dirName;
            const dirId = seasonDir.dirId;
            const seasonHeading = `<div id="recording-season-${dirId}" class="series-season-header">${dirName}</div>`;
            $(`#recording-series-${dir.dirId}`).append(seasonHeading);
            
            for(const episode in seasonDir.episodes) {
                const episodeHeading = `<div class="series-episode-header">${seasonDir.episodes[episode]}</div>`;
                $(`#recording-season-${dirId}`).after(episodeHeading);
            }
        }
    }
}
