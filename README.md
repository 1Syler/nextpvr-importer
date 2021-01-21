# nextpvr-importer

NextPVR allows you to add your own video files to the recordings list by importing an XML file. If you have lots of videos it could take a long time to create the XML file so I have created this to automate the process.


## Installation

I intend to integrate this into my NextPVR server but for now I have created it as a stand alone. First, you will need to set up a server and create a virtual host, then you can put the files in the virtual hosts directory. If you are using Linux you can use my virtual host creator to quickly set one up https://github.com/1Syler/apache-virtual-host-setup

I have tested this on both Linux and Windows, with Firefox and Chrome. Chrome works great but Firefox require some additional setup to get it working and it is unstable so not worth using.


## Usage

An example run with no options. Running with no options will get create the most basic information needed for a valid NextPVR XML file. The startTime and endTime for each file will be set using the default dummy time 02:00:00 (2 Hours), unless changed in Prefill Options.

Full Directory Path: /home/syler/Videos

Open Directoy: /home/syler/Videos/Movies

![alt text](https://github.com/1Syler/nextpvr-importer/blob/main/readme/no-options-run.png)


Once you have created a library you can run a custom regex filter on file properties. First you need to select a folder to run the filter on and then set the property and filter. The filter will replace the regex with "".

Selected Folder: Lethal Weapon (1 - 4)

File Property: Name

Regex: /1778 /g (remove "1778 " from the file names)

![alt text](https://github.com/1Syler/nextpvr-importer/blob/main/readme/run-filter.png)


You can also view and edit a files properties individually.

![alt text](https://github.com/1Syler/nextpvr-importer/blob/main/readme/view-file.png)
![alt text](https://github.com/1Syler/nextpvr-importer/blob/main/readme/edit-file.png)
![alt text](https://github.com/1Syler/nextpvr-importer/blob/main/readme/edited-file.png)


Running with FFmpeg as the data source will check the file to get an accurate startTime and endTime, this can be done after creating a library with no options. iTunes data source is a work in progress.

## Issues

It can be made to run on Firefox by enabling SSL and adding these header to the server response:

Header set Cross-Origin-Opener-Policy: same-origin

Header set Cross-Origin-Embedder-Policy: require-corp

Unfortunately, when running it on > 20 files for me, Firefox consumes all of my RAM and crahes. If you try to run FFmpeg in Firfox and it can run it will inform you.

On Chrome it will run through all files and add them to the list but it may have problems reading some files. It seems to be an issue with FFmpeg as it can read the files on their own but not when run as part of a much larger number of files. I will file a bug for this.

Bug reported https://github.com/ffmpegwasm/ffmpeg.wasm/issues/144

## TODO
* Re organise the code - WIP
* Implement saving data to IndexedDB - WIP - Now working but incomplete and buggy
* Once the data is saved can implement rescanning for files that failed to be read by FFmpeg
* Grab details file details from other sources as addition/alternative to FFmpeg when it fails - WIP
* Generate .sh/.bat file to rename physical files with the filtered names
