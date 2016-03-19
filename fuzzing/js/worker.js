var current = 0;
var end = 65535;
var html = "";
var handler = null;
var exp = '<a href="http://:{char}aidu.com">:{i}</a>';

// num per times
var duration = 200;

self.addEventListener("message", function(msg) {

    // switch by type
    switch(msg.data.type) {
        case "start":
            // Worker is running
            if(handler) return;

            current = 0;
            end = msg.data.end;
            html = "";
            exp = msg.data.exp;

            handler = setInterval(triggerProgress, 60);
            startContactHTML();
    }
});

function startContactHTML() {
    for(var i=current; i<=end&&i<current+duration; i++) {
        html += formatHTML(exp, i);
    }
    current = i;
    if(current <= end) setTimeout(startContactHTML, 0);
}

function workDone() {
    self.postMessage({
        type: "done",
        html: html,
    })
}

function triggerProgress() {
    var percent = (current/end*100).toFixed(1);

    self.postMessage({
        type: "progress",
        percent: percent,
    });

    if(current >= end) {
        clearInterval(handler);
        workDone();
        cleanMem();
    }
}

function formatHTML(html, i){
    html = html.replace(/:{i}/, i);
    if(/:{char}/.test(html)){
        var char = String.fromCharCode(i);
        html = html.replace(/:{char}/, char);
    }
    return html;
}

function cleanMem() {
    html = "";
    handler = null;
}
