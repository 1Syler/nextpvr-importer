/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    directoryOpen,
    fileSave,  
} from 'https://unpkg.com/browser-nativefs';

(async () => {  
    const openDirectoryButton = document.querySelector('#open-directory');
    const saveButton = document.querySelector('#save');
    const filterButton = document.querySelector('#run-filter');
    
    // Load classes
    const template = new recordingsTemplate(false);
    const ffmpeg = new ffmpegData();
    const libraryUi = new recordingUi();
    const libraries = new storedLibraries();
    libraries.loadLibraries(libraryUi);
    
    openDirectoryButton.addEventListener('click', async () => {
        try {
            const blobs = await directoryOpen({recursive: true});
            $("#error-message").css("display", "none");
            
            // Sort the recordings then add them in recordingsTemplate
            blobs.sort((a, b) => {
                a = a.webkitRelativePath.toLowerCase();
                b = b.webkitRelativePath.toLowerCase();
                
                if (a < b) {
                    return -1;
                } else if (a > b) {
                    return 1;
                }
                return 0;
            });
            const dataSourceOpt = $('input[name="data-source"]:checked').val();
            template.addRecordings(blobs, dataSourceOpt);
            console.log(template);
            
            // Gather other data if user has selected a data source option
            await libraryUi.createDirectories(template.getRecordings());
            if(dataSourceOpt == 0) {
                libraries.saveLibrary(template);
                libraryUi.createDirUi(false, false);
                filterButton.disabled = false;
            } else if(dataSourceOpt == 1) {
                ffmpeg.runFfmpeg(template.getRecordings(), libraryUi)
            } else if(dataSourceOpt == 2) {
                //testapicall(blobs);
            }
            
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
            }
        }
    });  

    saveButton.addEventListener('click', async () => {
        let blob = new Blob(template.getRecordingsXML(), {type: 'text/xml'});

        try {
            await fileSave(blob, {
                fileName: 'videos.xml',
                extensions: ['.xml'],
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
            }
        }
    });

    openDirectoryButton.disabled = false;
    saveButton.disabled = false;
})();

