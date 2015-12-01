(function() {
    var IPWorker = new Worker("js/ip-worker.js");

    IPWorker.addEventListener("message", function(msg) {
        console.log(msg);
    });
    IPWorker.postMessage({});

    function getIntranetIP(callback) {
        var ip_dups = {};
        var RTCPeerConnection = window.RTCPeerConnection
            || window.mozRTCPeerConnection
            || window.webkitRTCPeerConnection;

        var mediaConstraints = {
            optional: [{RtpDataChannels: true}]
        };

        var server;
        if(window.webkitRTCPeerConnection) {
            server = {iceServers: []};
        }

        var pc = new RTCPeerConnection(server, mediaConstraints);
        pc.onicecandidate = function(ice) {
            if(ice.candidate) {
                var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                var ip_addr = ip_regex.exec(ice.candidate.candidate)[1];
                if(ip_dups[ip_addr] === undefined) {
                    callback(ip_addr);
                }
                ip_dups[ip_addr] = true;
            }
        };

        pc.createDataChannel("");
        pc.createOffer(function(result) {
            pc.setLocalDescription(result, function(){});
        }, function(){});
    };

    $ul = document.getElementById("ip-list");
    window.setLive = function(ip) {
        console.log("------",ip);
        var $li = document.createElement("li");
        $li.innerText = ip;
        $ul.appendChild($li);
    }

    function setIP(ip) {
        $ip = document.getElementById("ip");
        $ip.innerText = "内网IP："+ip;
        liveIP(ip);
    }

    function liveIP(ip) {
        ip = ip.split(".");
        ip.pop();
        ip = ip.join(".");
        for(var i = 1; i <= 255; i++) {
            var $script = document.createElement("script");
            var url = "http://"+ip+"."+i+":80";
            $script.setAttribute("src", url);
            $script.setAttribute("onload", "setLive('"+ip+"."+i+"')");
            document.body.appendChild($script);
        }
    }

    getIntranetIP(setIP);
})();
