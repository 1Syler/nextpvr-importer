# nextpvr-importer

NextPVR allows you to add your own video files to the recordings list by importing an XML file. If you have lots of videos it could take a long time to create the XML file so I have created this to automate the process.


## Installation

I intend to integrate this into my NextPVR server but for now I have created it as a stand alone. First, you will need to set up a server and create a virtual host, then you can put the files in the virtual hosts directory. If you are using Linux you can use my virtual host creator to quickly set one up https://github.com/1Syler/apache-virtual-host-setup

I have tested this on both Linux and Windows, with Firefox and Chrome. Chrome works great but Firefox require some additional setup to get it working and it is unstable so not worth using.


## Issues

It can be made to run on Firefox by enabling SSL and adding these header to the server response:

Header set Cross-Origin-Opener-Policy: same-origin

Header set Cross-Origin-Embedder-Policy: require-corp

Unfortunately, when running it on > 20 files for me, Firefox consumes all of my RAM and crahes.

On Chrome it will run through all files and add them to the list but it may have problems reading some files which will leave the startTime and endTime as null, for now. It seems to be an issue with FFmpeg as it can read the files on their own but not when run as part of a much larger number of files. I will file a bug for this.

Bug reported https://github.com/ffmpegwasm/ffmpeg.wasm/issues/144

## TODO

* Add pre-fill input for Title, SubTitle, Genre etc
* Add ability to select a folder to apply filter too
* Implement saving data to IndexedDB
* Once the data is saved can implement rescanning for files that failed to be read by FFmpeg
* Grab details file details from other sources as addition/alternative to FFmpeg when it fails
