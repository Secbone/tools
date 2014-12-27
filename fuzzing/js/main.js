(function() {
    console.log("start");
    var exp = '<a href="http://:{char}aidu.com">:{i}</a>';
    var callback = 'for(var i in document.links){if(document.links[i].hostname=="baidu.com"){push(i)}}';
    var start = 0;
    var end = 65535;

    var result = [];

    var $expEl = document.getElementById("exp");
    var $cackEl = document.getElementById("cack");
    var $sizeEl = document.getElementById("size");
    var $library = document.getElementById("library");

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


    function startFuzzy() {
        exp = $expEl.value || exp;
        console.log(exp.test);
        for(var counter = start; counter <= end; counter++) {
            var fuzzyItem = newEl(formatHTML(exp, counter));
            $library.appendChild(fuzzyItem);
        }
    }

    startFuzzy();



})();
