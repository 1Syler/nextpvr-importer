function setRecordingYear(nameStr) {
    try {
        // Strips all character except aphanumeric and whitespaces
        // Creates an array from the string and reverses it
        // Assumes that the year is usually at the end of the name
        // which avoids a year in the actual recording name
        nameStr = nameStr.replace(/[^a-zA-Z0-9 ]/g, " ");
        let nameArr = nameStr.split(" ").reverse();
        
        let year = false;
        let yearFound = nameArr.some(function(str, index) {
            // Year found
            if(/\d{4}/.test(str)) {
                // Check year is valid
                if(/^(19[3-9]\d|20[0-4]\d|2050)$/.test(str)) {
                    year = nameArr[index];
                    return true
                }
            }
        });
        
        if(yearFound) {
            return year;
        }
        return year;
        
    }  catch (err) {
        console.error(`[ERROR] Error in setRecordingYear(): ${err}`);
    }
}

function filterFileNames(name, year) {
    try {
        if(year) {
            let index = name.lastIndexOf(year);
            if(index > -1) {
                // Remove all of the name after the year
                name = name.replace(/\./g, " ");
                name = name.replace(/[^a-zA-Z0-9 ]/g, "");
                name = name.substr(0, index);
            }
        }
        return name;
        
    }  catch (err) {
        console.error(`[ERROR] Error in filterFileName(): ${err}`);
    }
}

function myFunction() {
    console.log("hey");
}

// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms))
async function testapicall(blobs) {
    let n = 1;
    for (const blob of blobs) {
        let year = setRecordingYear(blob.name);
        let name = filterFileNames(blob.name, year);
        console.log(n);
        console.log(name);
        if(n % 5 == 0) {
            await timer(5000); // then the created Promise can be awaited
        }
        myFunction();
        n++;
    }
    

    /*$.ajax({
        url: "http://itunes.apple.com/search?term=catch+me+if+you+can&limit=10",
        dataType: 'JSONP',
        success:  function(result){
            console.log(result);
        }
    });*/
}


class itunesDataTemplate {
    constructor() {
        this.artistName = "Phil Alden Robinson",
        this.artworkUrl100 = "https://is1-ssl.mzstatic.com/image/thumb/Video/v4/60/85/2f/60852f33-9457-da89-016e-6ccf77f1719b/source/100x100bb.jpg",
        this.kind = "feature-movie",
        this.longDescription = "",
        this.primaryGenreName = "Action & Adventure",
        this.releaseDate = "1992-09-11T07:00:00Z",
        this.trackId = 283963264,
        this.trackName = "Sneakers",
        this.trackTimeMillis = 7516895,
        this.trackViewUrl = "https://itunes.apple.com/us/movie/sneakers/id283963264?uo=4"
    }
};

class itunesApi {
    constructor(template) {
        this.template = template;
        this.dataTemplates = [];
        this.dataTemplateCount = 0;
        this.name = null;
        this.year = null;
        this.genre = null;
    }
    
    addDataTemplate(status) {
        this.dataTemplateCount = this.dataTemplates.push(new itunesDataTemplate);
        if(status) {
            //this.fetchData();
        }
    }
    
    async fetchData() {
        let url = "itunes.apple.com/search?term=radiohead";
        $.ajax() ({
            type: 'GET',
            url: url,
            dataType: 'json',
            success:  function(result){
                console.log(result);
            }
        });
        
        /*var jqxhr = await $.ajax(  )
          .done(function(data) {
            console.log(data);
          })
          .fail(function() {
            console.log( "error" );
          })
          .always(function() {
            console.log( "complete" );
          });
         
        // Perform other work here ...
         
        // Set another completion function for the request above
        jqxhr.always(function() {
          console.log( "second complete" );
        });*/
    }
}
