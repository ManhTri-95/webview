// function for extending a class

window.viewManager = function(){}

viewManager.prototype.init = function() {
  
}

window.baseOS = function(){
  console.log('ios')
}

baseOS.prototype.getMsgJson = function(params){
  console.log(params)
}

/**
 * IOS
 */
window.iOS = function(){
  console.log('ios')
}
window.iOS.prototype = window.baseOS.prototype;

window.iOS.prototype.postMessage = function(fncName, msg){
  msg = this.getMsgJson(msg);
  window.webkit.messageHandlers[fncName].postMessage(msg);
}


/**
 * Android
 */
window.Android = function(){
  console.log('android')
}

window.Android.prototype = window.baseOS.prototype;

window.Android.prototype.postMessage = function(fncName, msg){
  msg = this.getMsgJson(msg);
  if ((window.android || window.Android)) {
    (window.android || window.Android)[fncName](msg);
  }
  
}

Android.prototype = new viewManager();
iOS.prototype = new viewManager();


