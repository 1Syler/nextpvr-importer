sudo cp /opt/nextpvr/system/wwwroot/settings.html /opt/nextpvr/system/wwwroot/settings.html.bk
sudo cp settings.html /opt/nextpvr/system/wwwroot/settings.html

sudo cp components/directory-open-modal.js /opt/nextpvr/system/wwwroot/components/directory-open-modal.js
sudo cp components/library-display-modal.js /opt/nextpvr/system/wwwroot/components/library-display-modal.js

sudo cp components/data-source-ffmpeg-class.js /opt/nextpvr/system/wwwroot/components/data-source-ffmpeg-class.js
sudo cp components/importer-tool.js /opt/nextpvr/system/wwwroot/components/importer-tool.js
sudo cp components/recording-data-class.js /opt/nextpvr/system/wwwroot/components/recording-data-class.js
sudo cp components/recording-ui-class.js /opt/nextpvr/system/wwwroot/components/recording-ui-class.js

sudo cp components/import-settings.css /opt/nextpvr/system/wwwroot/components/import-settings.css

sudo cp images/artwork_placeholder.png /opt/nextpvr/system/wwwroot/images/artwork_placeholder.png

sudo cp -r vendor/browser-nativefs/ /opt/nextpvr/system/wwwroot/vendor
sudo cp -r vendor/ffmpeg/ /opt/nextpvr/system/wwwroot/vendor

sudo service nextpvr-server restart
