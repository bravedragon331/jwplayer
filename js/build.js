function initJWPlayer(video_url, transcription_url) {
  var chapters = [];
  var captions = [];
  var caption = -1;
  var matches = [];
  var query = "";
  var cycle = -1;

  var transcript = document.getElementById('transcript');
  var search = document.getElementById('search');
  var match = document.getElementById('match');
  var svgWrapper = document.getElementById("svg-wrapper");
  var b_transcript = false;
  var video, seekBar, volumeBar, captionButton, player, transcriptWrapper, keywordWrapper, playButton, muteButton, fullScreenButton, playSpeedButton;

  // Setup JW Player
  jwplayer("player").setup({
    file: video_url,
    // tracks: [{
    //   file: "assets/jwplayer/assets/chapters.vtt",
    //   kind: "chapters"
    // }],
    displaytitle: false,
    width: 1140,
    height: 740,
    controls: false
  });

  // Load chapters / captions
  jwplayer().on('ready', function () {
    if (transcription_url) {
      loadCaptions()
    }
    setUpControls()
  });

  function setUpControls() {
    video = document.getElementsByClassName("jw-video")[0];

    // Buttons
    playButton = document.getElementById("playPauseButton");
    nextWordButton = document.getElementById("nextWordButton");
    muteButton = document.getElementById("mute");
    fullScreenButton = document.getElementById("full-screen");
    playSpeedButton = document.getElementById("playSpeedButton");

    // Sliders
    seekBar = document.getElementById("seek-bar");
    volumeBar = document.getElementById("volume-bar");

    // Caption Button
    captionButton = document.getElementById("captionButton");
    player = document.getElementById('player');

    transcriptWrapper = document.getElementsByClassName("transcript-wrapper")[0]
    keywordWrapper = document.getElementsByClassName("keyword-wrapper")[0]

    // Event listener for the play/pause button
    playButton.addEventListener("click", function () {
      if (video.paused == true) {
        // Play the video
        video.play();
        // Update the button text to 'Pause'
        playButton.classList.add("Pause");
        playButton.classList.remove("Play");
      } else {
        // Pause the video
        video.pause();
        // Update the button text to 'Play'
        playButton.classList.add("Play");
        playButton.classList.remove("Pause");
      }
    });

    // Event listener for the mute button
    muteButton.addEventListener("click", function () {
      if (video.muted == false) {
        // Mute the video
        video.muted = true;

        // Update the button text
        muteButton.classList.add('in-active')
        muteButton.classList.remove('active')
      } else {
        // Unmute the video
        video.muted = false;

        // Update the button text
        muteButton.classList.add('active')
        muteButton.classList.remove('in-active')
      }
    });

    // Event listener for the full-screen button
    fullScreenButton.addEventListener("click", function () {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen(); // Firefox
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen(); // Chrome and Safari
      }
    });

    // Event listener for play speed button
    playSpeedButton.addEventListener("click", function () {
      video.playbackRate = video.playbackRate + 0.5;
      if (video.playbackRate === 2.5) {
        video.playbackRate = 1;
      }
      playSpeedButton.innerHTML = video.playbackRate + 'x';
    })

    nextWordButton.addEventListener("click", function () {
      if (matches.length === 0) return;
      if (cycle >= matches.length - 1) {
        cycleSearch(0);
      } else {
        cycleSearch(cycle + 1);
      }
    })

    // Event listener for the seek bar
    seekBar.addEventListener("change", function () {
      // Calculate the new time
      var time = video.duration * (seekBar.value / 1);

      // Update the video time
      video.currentTime = time;
    });

    // Update the seek bar as the video plays
    video.addEventListener("timeupdate", function () {
      // Calculate the slider value
      var value = (1 / video.duration) * video.currentTime;
      // Update the slider value
      seekBar.value = value;
      document.getElementsByClassName("end-time")[0].innerHTML = convertSeconds(video.duration);
      document.getElementsByClassName("current-time")[0].innerHTML = convertSeconds(video.currentTime);
    });


    // Pause the video when the slider handle is being dragged
    seekBar.addEventListener("mousedown", function () {
      video.pause();
    });

    // Play the video when the slider handle is dropped
    seekBar.addEventListener("mouseup", function () {
      video.play();
    });

    // Event listener for the volume bar
    volumeBar.addEventListener("change", function () {
      // Update the video volume
      video.volume = volumeBar.value;
    });

    //Event for caption button
    captionButton.addEventListener("click", function () {
      if (!b_transcript) {
        player.classList.add("left-side");
        // transcript.classList.add("right-side");
        transcriptWrapper.classList.add("right-side");
      } else {
        player.classList.remove("left-side");
        // transcript.classList.remove("right-side");
        transcriptWrapper.classList.remove("right-side");
        // player.style.width = 1140;
        // player.style.height = 740;
      }
      b_transcript = !b_transcript;
    })

    captionButton.click();


    window.onresize = function(event) {      
      // if (player.classList.contains("left-side")) {
      player.style.height = player.offsetWidth * (740/1140);
      transcriptWrapper.style.height = player.offsetWidth * (740/1140)-70;
      transcript.style.height = player.offsetWidth * (740/1140)-70;  
      // }
    };

    window.addEventListener("orientationchange", function() {
      player.style.height = player.offsetWidth * (740/1140);
      transcriptWrapper.style.height = player.offsetWidth * (740/1140)-70;
      transcript.style.height = player.offsetWidth * (740/1140)-70;  
    });

    
    if (player.classList.contains("left-side")) {
      player.style.height = player.offsetWidth * (740/1140);
      transcriptWrapper.style.height = player.offsetWidth * (740/1140)-70;
      transcript.style.height = player.offsetWidth * (740/1140)-70;  
    }
  }

  function convertSeconds(totalSeconds) {
    var date = new Date(null);
    date.setSeconds(totalSeconds); // specify value for SECONDS here
    var result = date.toISOString().substr(11, 8);
    return result;
    // let hours = Math.floor(totalSeconds / 3600);
    // totalSeconds %= 3600;
    // let minutes = Math.floor(totalSeconds / 60);
    // let seconds = totalSeconds % 60;
    // return hours+":"+minutes+":"+Number(seconds).toFixed(0);
  }

  function loadCaptions() {
    var r = new XMLHttpRequest();
    r.onreadystatechange = function () {
      if (r.readyState == 4 && r.status == 200) {
        var t = r.responseText.split(/\n\s*\n/);
        t.shift();
        var h = "<p>";
        var s = 0;
        for (var i = 0; i < t.length; i++) {
          var c = parse(t[i]);
          // if (s < chapters.length && c.begin > chapters[s].begin) {
          //   h += "</p><h4>" + chapters[s].text + "</h4><p>";
          //   s++;
          // }
          c.text = c.text.replace(/&gt;&gt;/g, '<br>') // This is for cielo case
          if (c.text.indexOf('<br>') === 0) {
            c.text = c.text.substring(4);
          }
          h += "<span id='caption" + i + "' class='caption'><span class='caption-dot'></span><span class='caption-time'>" + '<i class="fa fa-play-circle-o" aria-hidden="true"></i> ' + c.btext + "&nbsp&nbsp&nbsp&nbsp" + "</span><span class='caption-text'>" + c.text + "</span></span>";
          captions.push(c);
        }
        transcript.innerHTML = h + "</p>";
      }
    };
    r.open('GET', transcription_url, true);
    r.send();
  };

  function parse(d) {
    var a = d.split("\n");
    var i = a[1].indexOf(' --> ');
    var t = a[2];
    if (a[3]) {
      t += " " + a[3];
    }
    t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return {
      begin: seconds(a[1].substr(0, i)),
      btext: a[1].substr(3, i - 7),
      end: seconds(a[1].substr(i + 5)),
      text: t
    }
  };

  function seconds(s) {
    var a = s.split(':');
    var r = Number(a[a.length - 1]) + Number(a[a.length - 2]) * 60;
    if (a.length > 2) {
      r += Number(a[a.length - 3]) * 3600;
    }
    return r;
  };

  // Highlight current caption and chapter
  jwplayer().on('time', function (e) {
    var p = e.position;
    for (var j = 0; j < captions.length; j++) {
      if (captions[j].begin < p && captions[j].end > p) {
        if (j != caption) {
          var c = document.getElementById('caption' + j);
          if (caption > -1) {
            document.getElementById('caption' + caption).className = "";
          }
          c.className = "current";
          if (query == "") {
            transcript.scrollTop = c.offsetTop - transcript.offsetTop - 40;
          }
          caption = j;
        }
        break;
      }
    }
  });

  // Hook up interactivity
  if (transcript) {
    transcript.addEventListener("click", function (e) {
      if (e.target.id.indexOf("caption") == 0) {
        var i = Number(e.target.id.replace("caption", ""));
        jwplayer().seek(captions[i].begin);
      }
    });
  }
  if (search) {
    search.addEventListener('focus', function (e) {
      setTimeout(function () {
        search.select();
      }, 100);
    });
    search.addEventListener('keydown', function (e) {
      if (e.keyCode == 27) {
        resetSearch();
      } else if (e.keyCode == 13) {
        var q = this.value.toLowerCase();
        if (q.length > 0) {
          if (q == query) {
            if (cycle >= matches.length - 1) {
              cycleSearch(0);
            } else {
              cycleSearch(cycle + 1);
            }
          } else {
            searchTranscript(q);
          }
        } else {
          resetSearch();
        }
      }
    });
  }

  // Execute search
  function searchTranscript(q) {
    resetSearch();    
    matches = [];
    query = q;
    for (var i = 0; i < captions.length; i++) {
      var m = captions[i].text.toLowerCase().indexOf(q.toLowerCase());
      if (m > -1) {
        document.getElementById('caption' + i).innerHTML =
          "<span class='caption-dot'></span><span class='caption-time'>" + '<i class="fa fa-play-circle-o" aria-hidden="true"></i> ' + 
          captions[i].btext +"&nbsp&nbsp&nbsp&nbsp" + "</span><span class='caption-text'>"+
          captions[i].text.substr(0, m) + "<em>" +
          captions[i].text.substr(m, q.length) + "</em>" +
          captions[i].text.substr(m + q.length) + "</span>";
        matches.push(i);
      }
    }
    if (q === '') {
      matches = [];
    }
    displaysvg(matches);
    if (matches.length) {
      cycleSearch(0);
      nextWordButton.classList.add('active');
    } else {
      nextWordButton.classList.remove('active');
      resetSearch();
    }
  };

  function cycleSearch(i) {
    if (cycle > -1) {
      var o = document.getElementById('caption' + matches[cycle]);
      o.getElementsByTagName("em")[0].className = "";
    }
    var c = document.getElementById('caption' + matches[i]);
    jwplayer().seek(captions[matches[i]].begin);
    // c.getElementsByTagName("em")[0].className = "current";
    // match.innerHTML = (i + 1) + " of " + matches.length;
    transcript.scrollTop = c.offsetTop - transcript.offsetTop - 40;
    cycle = i;
  };

  function resetSearch() {
    if (matches.length) {
      for (var i = 0; i < captions.length; i++) {
        document.getElementById('caption' + i).innerHTML = "<span class='caption-dot'></span><span class='caption-time'>" + '<i class="fa fa-play-circle-o" aria-hidden="true"></i> ' + captions[i].btext + "&nbsp&nbsp&nbsp&nbsp" + "</span><span class='caption-text'>" + captions[i].text + "</span>"
      }
    }
    query = "";
    matches = [];
    // match.innerHTML = "0 of 0";
    cycle = -1;
    transcript.scrollTop = 0;
  };

  function displaysvg(matches) {
    // [24, 25, 43, 44, 46, 47, 50, 59]
    svgWrapper.innerHTML = '';
    var ht = '';
    for (let i = 0; i < captions.length; i++) {
      for (let j = 0; j < matches.length; j++) {
        if (i === matches[j]) {
          ht += `
          <div class="svg" style="left: ${captions[i].begin/video.duration*100}%" title="${captions[i].btext}" data-index="${i}">
            <svg width="20px" height="20px" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 100 100 L 300 100 L 200 300 z"
                fill="LightBlue"
                stroke="Blue"
                stroke-width="3"
              />
            </svg>
          </div>
          `
        }
      }
    }
    svgWrapper.innerHTML = ht;

    // SVG click event    
    $(".svg").on('click', function () {
      for (let i = 0; i < captions.length; i++) {
        if (i === $(this).data('index')) {
          // console.log(captions[i]);
          video.currentTime = captions[i].begin;
        }
      }
    })
  }
  

  return {
    searchTranscript: searchTranscript
  }
}

let player;

let video_url = 'https://s3.amazonaws.com/video-hive/1/679312ad-142e-4315-5de4-752dc8457792.mp4'
let transcription_url = 'https://s3.amazonaws.com/video-hive/caption/df3b99cab0a14a7b9402501f17df1537.vtt'
startPlay(video_url, transcription_url);

function startPlay(video_url, transcription_url) {
  player = initJWPlayer(video_url, transcription_url)
}

function searchKeyword(keyword) {
  // var keyword = document.getElementById("keyword").value;
  // document.getElementById('search').value = keyword
  // document.getElementById("search").focus();
  player.searchTranscript(keyword);
}

var show_keyword = true;
var keywordToggleButton = document.getElementById("toggleSearch");
keywordToggleButton.addEventListener("click", function () {
  var keywordWrapper = document.getElementsByClassName("keyword-wrapper")[0];
  if (show_keyword) {
    keywordWrapper.classList.remove("hide");
    keywordToggleButton.classList.add('active')
    keywordWrapper.style.width = document.getElementsByClassName("transcript-wrapper")[0].offsetWidth;
  } else {
    keywordWrapper.classList.add("hide");
    keywordToggleButton.classList.remove('active')
    searchKeyword('')
  }
  show_keyword = !show_keyword;
})