'use strict';
(function() {
     var oldOnLoad, lastDeletedItems, results, status;

     function createElement(id, element) {
          var el = document.createElement(element || 'span');
          el.setAttribute('id', id);
          return el;
     }

     function filterResults(items, pattern, callback) {
          worker = new Worker('scripts/filter_worker.js');
          worker.onmessage = function(e) {
                callback(e.data);
                worker.terminate();
          };
          return worker.postMessage({
			  items: items,
			  pattern: pattern
		  });
     }

     function onLoad() {
          var button = document.getElementById('deleteButton'),
               body = document.querySelector('body');
          button.setAttribute('value', chrome.i18n.getMessage('buttonDelete'));
          button.addEventListener('click', onClickDelete);

          results = createElement('results');
          results.innerHTML = "0";
          body.appendChild(results);


          status = createElement('staus', 'p');
          body.appendChild(status);
          status.innerHTML = "-";
     }

     function log(str) {
          status.innerHTML = str + '<br>' + status.innerHTML;
     }

     function deleteHistoryItems(items) {
          var n = items.length,
               deleted = n,
               counter, counterValue;
          counter = results;
          counterValue = parseInt(counter.innerHTML, 10);
          log('Deleting ' + n + items[0].url + ' items from ' + counterValue + ".");
          while (n--) {
               chrome.history.deleteUrl(items[n]);
          }
          lastDeletedItems = deleted;
          counter.innerHTML = counterValue + deleted;
          return deleted;
     }

     function deleteAllHistoryItems(pattern) {
          var fn, callback;
          log('Looking for pattern: ' + pattern);
          callback = function(items) {
               log('Found ' + items.length);
               if (items.length > 0) {
                    var deleted = deleteHistoryItems(items);
                    if (deleted === 1000) {
                         fn();
                    }
               } else {
                    log('Done');
               }
          };
          fn = function() {
               chrome.history.search({
                    text: pattern,
                    maxResults: 100
               }, callback);
          };
          fn();


     }

     function onClickDelete() {

          //chrome.window.
          /*
		if(confirm("are")) {
		}
		if(confirm(chrome.i18n.getMessage('confirmDelete'))) {
		//	alert('ok');
		}*/
          var textInput = document.getElementById('inputPattern');
          deleteAllHistoryItems(textInput.value);
     }

     oldOnLoad = window.onload;
     window.onload = function() {
          if (oldOnLoad) {
               oldOnLoad();
          }
          onLoad();
     };
})();
