(function() {
    console.log("start");
    var expDefault = '<a href="http://:{char}aidu.com">:{i}</a>';
    var exp = expDefault;
    var callbackDefault = 'for(var i in document.links){if(document.links[i].hostname=="baidu.com"){push(document.links[i].innerHTML)}}';
    var endDefault = 65535;
    var end = endDefault;


    var result = [];

    var $expEl = document.getElementById("exp");
    var $callbackEl = document.getElementById("callback");
    var $sizeEl = document.getElementById("size");
    var $resultEl = document.getElementById("result");
    var $charsEl = document.getElementById("chars");
    var $library = document.getElementById("library");
    var $startBtn = document.getElementById("start");
    var $progressEL = document.getElementById("progress");
    var $progLine = document.getElementById("prog-line");
    var $lineBefore = document.getElementById("line-before");
    var $lineAfter = document.getElementById("line-after");

    var HTMLWorker = new Worker("js/worker.js");

    // Add listener to worker
    HTMLWorker.addEventListener("message", function(msg) {

        // switch by type
        switch (msg.data.type) {
            case "progress":
                setRotate(msg.data.percent);
                break;
            case "done":
                evalCallback(msg.data.html);
                break;
        }
    });

    window.onload = function(){
        $expEl.value = expDefault;
        $callbackEl.value = callbackDefault;
        $startBtn.addEventListener("click", startFuzzy);
    }

    // API push
    function push(data) {
        result.push(data);
        getResult();
    }

    // Default display result
    function getResult(){
        $resultEl.value = result.join(",");
        $charsEl.value = "";
        for(var index in result){
            $charsEl.value += String.fromCharCode(result[index]);
        }
    }


    // Display percent string and circle
    function setRotate(percent) {
        $progressEL.innerHTML = (percent)+"%";

        var rotate = 360*percent/100-180;
        if(percent < 50) {
            if($progLine.className != "progress-line")
                $progLine.className = "progress-line";
            if($lineBefore.className != "before")
                $lineBefore.className = "before";
            $lineBefore.style = "transform: rotate("+rotate+"deg)";
        }else {
            if($progLine.className != "progress-line full")
                $progLine.className = "progress-line full";
            if($lineBefore.className != "before full")
                $lineBefore.className = "before full";
            $lineAfter.style = "transform: rotate("+rotate+"deg)";
        }
    }

    // Set default value
    function insetFuzzyEl(){

        // Start Worker
        HTMLWorker.postMessage({
            type: "start",
            exp: $expEl.value || expDefault,
            end: $sizeEl.value || endDefault,
        });
    }

    // Eval CallBack (html) -> nulls
    function evalCallback(html){
        callback = $callbackEl.value || callbackDefault;
        $library.innerHTML = html;
        eval(callback);
    }

    // Click start Fuzzy
    function startFuzzy() {
        result = [];
        $library.innerHTML = "";

        insetFuzzyEl();
    }

})();
