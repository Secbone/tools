(function() {
    console.log("start");
    var expDefault = '<a href="http://:{char}aidu.com">:{i}</a>';
    var exp = expDefault;
    var callbackDefault = 'for(var i in document.links){if(document.links[i].hostname=="baidu.com"){push(document.links[i].innerHTML)}}';
    var start = 0;
    var endDefault = 65535;
    var end = endDefault;


    var result = [];

    var counter = 0;

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

    function push(data) {
        result.push(data);
        getResult();
    }

    function newEl(html) {
        var parentEl = document.createElement("div");
        parentEl.innerHTML = html;
        return parentEl.childNodes[0];
    }

    function formatHTML(html, i){
        html = html.replace(/:{i}/, i);
        if(/:{char}/.test(html)){
            var char = String.fromCharCode(i);
            html = html.replace(/:{char}/, char);
        }
        return html;
    }

    function setRotate(percent) {
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

    function updateProgress(counter, total){
        if(counter <= end) {
            var fuzzyItem = newEl(formatHTML(exp, counter));
            $library.appendChild(fuzzyItem);
            var percent = (counter/total*100).toFixed(1);
            $progressEL.innerHTML = (percent)+"%";
            setRotate(percent);
            setTimeout(function(){
                updateProgress(counter, total);
            }, 0);
            counter++;
        }else{
            evalCallback();
        }
    }

    function insetFuzzyEl(){
        exp = $expEl.value || expDefault;
        end = $sizeEl.value || endDefault;
        counter = start;
        var total = end - start;
        updateProgress(counter, total);
    }

    function evalCallback(){
        callback = $callbackEl.value || callbackDefault;
        eval(callback);
    }

    function getResult(){
        $resultEl.value = result.join(",");
        $charsEl.value = "";
        for(var index in result){
            $charsEl.value += String.fromCharCode(result[index]);
        }
    }

    function startFuzzy() {
        result = [];
        $library.innerHTML = "";

        insetFuzzyEl();
        //evalCallback();
    }

    window.onload = function(){
        $expEl.value = expDefault;
        $callbackEl.value = callbackDefault;
        $startBtn.addEventListener("click", startFuzzy);
    }

})();
