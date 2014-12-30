(function() {
    console.log("start");
    var expDefault = '<a href="http://:{char}aidu.com">:{i}</a>';
    var callbackDefault = 'for(var i in document.links){if(document.links[i].hostname=="baidu.com"){push(document.links[i].innerHTML)}}';
    var start = 0;
    var endDefault = 65535;

    var result = [];

    var $expEl = document.getElementById("exp");
    var $callbackEl = document.getElementById("callback");
    var $sizeEl = document.getElementById("size");
    var $resultEl = document.getElementById("result");
    var $charsEl = document.getElementById("chars");
    var $library = document.getElementById("library");
    var $startBtn = document.getElementById("start");
    var $progressEL = document.getElementById("progress");

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

    function updateProgress(counter){
        $progressEL.innerHTML = counter;
    }

    function insetFuzzyEl(){
        var exp = $expEl.value || expDefault;
        var end = $sizeEl.value || endDefault;
        for(var counter = start; counter <= end; counter++) {
            //updateProgress(counter);
            var fuzzyItem = newEl(formatHTML(exp, counter));
            $library.appendChild(fuzzyItem);
        }
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
        evalCallback();
    }

    window.onload = function(){
        $expEl.value = expDefault;
        $callbackEl.value = callbackDefault;
        $startBtn.addEventListener("click", startFuzzy);
    }

})();
