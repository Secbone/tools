var current = 0;
var end = 65535;
var html = "";
var handler = null;
var exp = '<a href="http://:{char}aidu.com">:{i}</a>';

// num per times
var duretion = 200;

self.addEventListener("message", function(msg) {
    console.log(msg);

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
    for(var i=current;i<=end&&i<current+duretion;i++) {
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
        handler = null;
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
