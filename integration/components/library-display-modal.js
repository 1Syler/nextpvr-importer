window.onload = function () {
    var app = new Vue({
        el: '#app',
        data: {
        }
    });
};

Vue.component('library_display_modal', {
    data: function () {
        return {
            items: "",
            title: "",
            subTitle: "",
            location: "",
            duration: "",
            genre: "",
            year: "",
            seriesDetails: "",
            file: ""
        };
    },
    template: '<div class="modal fade" id="libraryDisplayModal" tabindex="-1" role="dialog"\
                aria-labelledby="libraryDisplayModalLabel" aria-hidden="true">\
                    <div class= "modal-dialog mw-100 w-50" role="document" >\
                        <div id="library-content" class="modal-content">\
                            <div class="modal-header">\
                                <div id="dir-title">\
                                    <h5 class="modal-title">{{title}}</h5>\
                                </div>\
                                <div id="file-title">\
                                    <h5 class="modal-title">\
                                        <i class="fas fa-arrow-left mr-2" @click="backToLibrary()"></i> {{title}}\
                                    </h5>\
                                </div>\
                                <div id="series-title">\
                                    <h5 class="modal-title">\
                                        <i class="fas fa-arrow-left mr-2" @click="backToLibrary()"></i> {{seriesDetails.name}}\
                                    </h5>\
                                </div>\
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\
                                    <span aria-hidden="true">&times;</span>\
                                </button>\
                            </div>\
                            <div class="modal-body">\
                                <div id="user-library"">\
                                    <div class="row">\
                                        <div id="error-message" class="col-lg-12 mb-3">\
                                        </div>\
                                        <div id="progress-indicator" class="col-lg-12 mb-3">\
                                            <div class="progress">\
                                                <div id="progress" class="progress-bar" role="progressbar"\
                                                 aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>\
                                                <div class="progress-bar-title"></div>\
                                            </div>\
                                        </div>\
                                    </div>\
                                    <div id="user-output">\
                                        <ul id="itemChoices" class="list-group">\
                                            <template v-for="(item, index) in items">\
                                                <li v-if="index == 0 && items[0].prevPathId" class="list-group-item"\
                                                 @click="browseFolder({item}, `prev`)" :key="`{{ item.dirId }}`">..</li>\
                                                <li v-else-if="item.hasOwnProperty(`dirId`)" class="list-group-item"\
                                                 @click="browseFolder({item}, `sub`)" :key="`{{ item.dirId }}`">\
                                                 <i class="fas fa-folder-open mr-2"></i> {{ item.dirName }}\
                                                 <i v-if="item.seriesDetails.isSeries" class="fa fa-list-alt float-right"\
                                                 @click="displaySeries({item})" :key="`{{ item.dirId }}`"></i></li>\
                                                <li v-else class="list-group-item"\
                                                 @click="displayFile({item})" :key="`{{ item.idNum }}`">\
                                                 <i class="fas fa-file mr-2"></i> {{ item.recordingData.unfilteredFileName }}</li>\
                                            </template>\
                                        </ul>\
                                    </div>\
                                    <div id="file-display">\
                                        <div class="row">\
                                            <div id="vid-img" class="col-lg-3 mb-3">\
                                                <img src="images/artwork_placeholder.png" alt="..." class="img-thumbnail w-100">\
                                            </div>\
                                            \
                                            <div class="col-lg-9">\
                                                <div class="row">\
                                                    <div class="col-lg-3 mb-2"><b class="text-white">Location:</b></div>\
                                                    <div class="data-edit col-lg-9 pl-0 mb-2">\
                                                        <span class="data-span" id="recording-filename">{{location}}</span>\
                                                        <input class="form-control form-control-sm edit-input" id="recording-filename-edit" :value="location">\
                                                    </div>\
                                                    <div class="col-lg-3 mb-2"><b class="text-white">title:</b></div>\
                                                    <div class="data-edit col-lg-9 pl-0 mb-2">\
                                                        <span class="data-span" id="recording-title">{{title}}</span>\
                                                        <input class="form-control form-control-sm edit-input" id="recording-title-edit" :value="title">\
                                                    </div>\
                                                    <div class="col-lg-3 mb-2"><b class="text-white">Sub title:</b></div>\
                                                    <div class="data-edit col-lg-9 pl-0 mb-2">\
                                                        <span class="data-span" id="recording-subtitle">{{subTitle}}</span>\
                                                        <input class="form-control form-control-sm edit-input" id="recording-subtitle-edit" :value="subTitle">\
                                                    </div>\
                                                    <div class="col-lg-3 mb-2"><b class="text-white">Duration:</b></div>\
                                                    <div class="data-edit col-lg-9 pl-0 mb-2">\
                                                        <span class="data-span" id="recording-duration">{{duration}}</span>\
                                                        <input class="form-control form-control-sm edit-input" id="recording-duration-edit" :value="duration">\
                                                    </div>\
                                                    <div class="col-lg-3 mb-2"><b class="text-white">Genre:</b></div>\
                                                    <div class="data-edit col-lg-9 pl-0 mb-2">\
                                                        <span class="data-span" id="recording-Genre">{{genre}}</span>\
                                                        <input class="form-control form-control-sm edit-input" id="recording-Genre-edit" :value="genre">\
                                                    </div>\
                                                    <div class="col-lg-3 mb-2"><b class="text-white">Year:</b></div>\
                                                    <div class="data-edit col-lg-9 pl-0 mb-2">\
                                                        <span class="data-span" id="recording-year">{{year}}</span>\
                                                        <input class="form-control form-control-sm edit-input" id="recording-year-edit" :value="year">\
                                                    </div>\
                                                </div>\
                                            </div>\
                                        </div>\
                                    </div>\
                                    <div id="series-display">\
                                        <ul class="list-group">\
                                            <template v-for="(season, index) in seriesDetails.seasons">\
                                                <li class="list-group-item">{{season.dirName}}</li>\
                                                <ul v-for="(episode, index) in season.episodes">\
                                                    <li class="list-group-item">{{episode}}</li>\
                                                </ul>\
                                            </template>\
                                        </ul>\
                                    </div>\
                                </div>\
                            </div>\
                            <div class= "modal-footer">\
                                <div id="dir-btns-left" class="mr-auto">\
                                    <button type="button" id="run-ffmpeg" class="btn btn-secondary">Get FFmpeg Data</button>\
                                    <button type="button" id="run-itunes" class="btn btn-secondary">Get iTunes Data</button>\
                                 </div>\
                                <div id="dir-btns-right" class="ml-auto">\
                                    <button type="button" id="save-xml" class="btn btn-success">Import Videos</button>\
                                 </div>\
                                <div id="file-btns">\
                                    <button id="recording-edit" @click="editRecording()" type="button" class="btn btn-secondary">Edit</button>\
                                    <button id="recording-save" @click="saveRecording({file})" type="button" class="btn btn-secondary">Save</button>\
                                 </div>\
                            </div>\
                        </div>\
                    </div>\
               </div>',
    mounted: function () {     
        var self = this;
    },
    methods: {
        browseFolder(args, target) {
            $("#error-message").hide();
            const self = this;
            let dirItems = [];
            let fileItems = [];
            
            try {
                if(target === "sub") {
                    dirItems = args.item.subFolders;
                    fileItems = args.item.files;
                    
                    // If there are no directories add the last directory
                    if(dirItems.length == 0) {
                        dirItems = dirItems.concat(args.item);
                        
                    // 
                    } else if(!dirItems[1] || dirItems[0].dirName != dirItems[1].dirName) {
                        dirItems.unshift(dirItems[0]);
                    }
                } else if(target === "prev") {
                    if(self.items[1] && !self.items[1].hasOwnProperty("dirId")) {
                        if(self.items[0].prevFolder.length == 0) {
                            dirItems = self.items[0];
                            fileItems = self.items[0].files;
                        } else {
                            dirItems = self.items[0].prevFolder[0].subFolders;
                            fileItems = self.items[0].prevFolder[0].files;
                        }
                    } else {
                        if(typeof args.item.prevFolder[0].prevFolder[0] !== "undefined") {
                            dirItems = args.item.prevFolder[0].prevFolder[0].subFolders;
                            fileItems = args.item.prevFolder[0].prevFolder[0].files;
                        } else {
                            dirItems = args.item.prevFolder;
                            fileItems = args.item.prevFolder[0].files;
                        }
                    }
                }
                
                self.items = dirItems.concat(fileItems);
                self.title = args.item.dirName;
            } catch(err) {
                console.log("empty");
            }
        },
        displayFile(args) {
            const self = this;
            $("#user-output").hide();
            $("#dir-title").hide();
            $("#dir-btns-left").hide();
            $("#dir-btns-right").hide();
            $("#file-display").show();
            $("#file-title").show();
            $("#file-btns").show();
            $("#series-title").hide();
            $("#series-display").hide();
            $("#error-message").hide();
            
            $("#library-content").css({"border-radius": "10px", "border": "1px solid skyblue", "box-shadow": "0 0 10px"});
            
            self.file = args.item;
            self.location = args.item.recordingXmlVals.filename;
            self.title = args.item.recordingXmlVals.title;
            self.subTitle = args.item.recordingXmlVals.subtitle;
            self.duration = args.item.recordingData.duration;
            self.genre = args.item.recordingXmlVals.Genre;
            self.year = args.item.recordingData.year;
        },
        
        editRecording() {
            const dataId = "file-display";
            document.querySelectorAll(`#${dataId} .data-edit span`).forEach(function(dataSpan) {
                $(dataSpan).hide();
            });
            document.querySelectorAll(`#${dataId} .data-edit input`).forEach(function(dataInput) {
                $(dataInput).show();
            });
        },
        saveRecording(args) {
            const self = this;
            const dataId = "file-display";
            const recXml = args.file.recordingXmlVals;
            const recData = args.file.recordingData;
            
            let propIds = [];
            document.querySelectorAll(`#${dataId} .data-edit span`).forEach(function(dataSpan) {
                propIds.push($(dataSpan).attr('id').split("-")[1]);
                $(dataSpan).show();
            });
            
            let propCounter = 0;
            document.querySelectorAll(`#${dataId} .data-edit input`).forEach(function(dataInput) {
                if(recXml.hasOwnProperty(propIds[propCounter])) {
                    recXml[propIds[propCounter]] = $(dataInput).val();
                } else {
                    recData[propIds[propCounter]] = $(dataInput).val();
                }
                    
                $(dataInput).hide();
                propCounter++;
            });
            const item = args.file;
            self.displayFile({item})
        },
        displaySeries(args) {
            const self = this;
            $("#user-output").hide();
            $("#dir-title").hide();
            $("#dir-btns-left").hide();
            $("#dir-btns-right").hide();
            $("#file-display").hide();
            $("#file-title").hide();
            $("#file-btns").hide();
            $("#error-message").hide();
            $("#series-title").show();
            $("#series-display").show();
            
            $("#library-content").css({"border-radius": "10px", "border": "1px solid skyblue", "box-shadow": "0 0 10px"});
            
            self.seriesDetails = args.item.seriesDetails;
        },
        backToLibrary() {
            const self = this;
            $("#user-output").show();
            $("#dir-title").show();
            $("#dir-btns-left").show();
            $("#dir-btns-right").show();
            $("#file-display").hide();
            $("#file-title").hide();
            $("#file-btns").hide();
            $("#series-title").hide();
            $("#series-display").hide();
            $("#error-message").hide();
            
            $("#library-content").css({"border-radius": "0", "border": "none", "box-shadow": "none"});
        },
        show(directories) {
            const self = this;
            self.items = directories;
            $('#libraryDisplayModal').modal('show');
            
            $("#error-message").hide();
            $("#dir-btns-left").show();
            $("#dir-btns-right").show();
            if($("#file-display").css("display") == "block") {
                self.backToLibrary();
            }
        }
    }
});
