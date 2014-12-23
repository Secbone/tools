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

    function push(data) {
        result.push(data);
    }


    function startFuzzy() {
        for(var counter = start; counter <= end; counter++) {

        }
    }



})();
