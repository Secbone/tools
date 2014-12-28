(function() {
    console.log("start");
    var exp = '<a href="http://:{char}aidu.com">:{i}</a>';
    var callback = 'for(var i in document.links){if(document.links[i].hostname=="baidu.com"){push(document.links[i].innerHTML)}}';
    var start = 0;
    var end = 65535;

    var result = [];

    var $expEl = document.getElementById("exp");
    var $callbackEl = document.getElementById("callback");
    var $sizeEl = document.getElementById("size");
    var $library = document.getElementById("library");
    var $startBtn = document.getElementById("start");

    function push(data) {
        result.push(data);
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

    function insetFuzzyEl(){
        exp = $expEl.value || exp;
        for(var counter = start; counter <= end; counter++) {
            var fuzzyItem = newEl(formatHTML(exp, counter));
            $library.appendChild(fuzzyItem);
        }
    }

    function evalCallback(){
        callback = $callbackEl.value || callback;
        eval(callback);
    }

    function getResult(){
        console.log(result);
    }

    function startFuzzy() {
        result = [];
        $library.innerHTML = "";

        insetFuzzyEl();
        evalCallback();
        getResult();
    }

    window.onload = function(){
        $startBtn.addEventListener("click", startFuzzy);
    }

})();
