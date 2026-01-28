// function for extending a class

window.viewManager = function(){}

viewManager.prototype.init = function() {
  
}
window.baseOS = function(){
  console.log('ios')
}

window.baseOS.prototype.getMsgJson = function(){}

window.iOS = function(){}

window.iOS.prototype = window.baseOS.prototype;

window.iOS.prototype.postMessage = function(fncName, msg){
    msg = this.getMsgJson(msg);
    window.webkit.messageHandlers[fncName].postMessage(msg);
}

window.Android = function(){}

window.Android.prototype = window.baseOS.prototype;

window.Android.prototype.postMessage = function(fncName, msg){
    msg = this.getMsgJson(msg);
    if ((window.android || window.Android)) {
      (window.android || window.Android)[fncName](msg);
    }
    
}

Android.prototype = new viewManager();
iOS.prototype = new viewManager();


