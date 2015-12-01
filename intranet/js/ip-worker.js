function getIntranetIP() {

}


self.addEventListener("message", function(msg) {
    console.log(self);
    self.postMessage(msg.data);
});
