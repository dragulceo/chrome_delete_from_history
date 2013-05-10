/* jshint -W015 */
'use strict';

chrome.runtime.onInstalled.addListener(function(details) {
     console.log('previousVersion', details.previousVersion);
});
