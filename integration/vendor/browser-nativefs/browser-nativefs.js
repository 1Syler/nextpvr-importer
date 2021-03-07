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

﻿window.onload = function () {
    var app = new Vue({
        el: '#app',
        data: {
        }
    });
    
    const openDirectoryButton = document.querySelector('#openLibrary');
    const saveButton = document.querySelector('#save-xml');
    
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
            // Run importer tool
            await importer.createLibrary(blobs);
            const appEle = app.$el;
            const modal = appEle.__vue__.$refs.openLibrary;
            const dirs = importer.library.directories[0];
            modal.show([dirs]);
            $("#error-message").hide();
            
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
            }
        }
    });
    

    saveButton.addEventListener('click', async () => {
        let blob = new Blob(importer.library.getRecordingsXML(), {type: 'text/xml'});

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
};
