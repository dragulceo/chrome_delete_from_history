(function() {
     'use strict';
     var console = chrome.extension.getBackgroundPage().console,
          oldOnLoad, lastDeletedItems, progress, status, SELECT_VALUE_URL_ONLY = 1,
          SELECT_VALUE_TITLE_ONLY = 2,
          PROGRESS_SEARCH_FINISHED = 'finished',
          PROGRESS_SEARCH_STARTED = 'started';
     window.onerror = function() {
          console.error(arguments);
     };

     function $(id) {
          return document.getElementById(id);
     }

     function createElement(id, element) {
          var el = document.createElement(element || 'span');
          el.setAttribute('id', id);
          return el;
     }

     function filterResults(items, search, callback) {
          var worker;
          worker = new Worker('scripts/filter_worker.js');
          worker.addEventListener('message', function(e) {
               if (e.data.type && e.data.type === 'progress') {
                     updateProgress(e.data.current / e.data.total * 100);
					 log(progress.value + '%');
               } else {
                    callback(e.data);
                    worker.terminate();
               }
          });
          return worker.postMessage({
               items: items,
               search: search
          });
     }

     function updateProgress(typeOrValue) {
          var value = 0,
               SEARCH_PERCENT = 50;
          if (typeof typeOrValue === "string") {
               switch (typeOrValue) {
                    case PROGRESS_SEARCH_FINISHED:
                         value = SEARCH_PERCENT;
                         break;
                    case PROGRESS_SEARCH_STARTED:
                         value = 1;
                         break;
               }
          } else {
               value = SEARCH_PERCENT + typeOrValue / (100 / SEARCH_PERCENT);
          }
		  log(value);
          progress.value = value / 100;
     }

     function onLoad() {
          var button = $('deleteButton'),
               body = document.querySelector('body');
          button.setAttribute('value', chrome.i18n.getMessage('buttonDelete'));
          button.addEventListener('click', onClickDelete);

          progress = createElement('progress', 'progress'); 
		  progress.value = 0;
          body.appendChild(progress);


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
          log('Deleting ' + n + ' items');
          while (n--) {
               chrome.history.deleteUrl({
                    url: items[n].url
               });
               log('Deleted: ' + items[n].url);
          }
          lastDeletedItems = deleted;
          return deleted;
     }

     function deleteAllHistoryItems(search) {
          var fn, searchCallback, filterCallback;
          log('Looking for pattern: ' + search.pattern);
          filterCallback = function(items) {
               console.log('Filtered items: ' + items.length);
               deleteHistoryItems(items);
          };
          searchCallback = function(items) {
               updateProgress(PROGRESS_SEARCH_FINISHED);
               if (items.length > 0) {
                    filterResults(items, search, filterCallback);
               } else {
                    log('Done');
               }
          };
          updateProgress(PROGRESS_SEARCH_STARTED);
          chrome.history.search({
               text: '',
               startTime: +(new Date()) - 3600 * 24 * 366 * 5 * 1000,
               maxResults: 100000
          }, searchCallback);

     }

     function onClickDelete() {
          //chrome.window.
          /*
		if(confirm("are")) {
		}
		if(confirm(chrome.i18n.getMessage('confirmDelete'))) {
		//	alert('ok');
		}*/
          var searchFields, selectFields = $('selectFields'),
               checkboxConfirmDelete = $('checkboxConfirmDelete'),
               inputPattern = $('inputPattern');

          if (inputPattern.value.length === 0) {
               log('Please enter the pattern');
          } else if (!checkboxConfirmDelete.checked) {
               log('Please check for confirmation');
          } else {
               checkboxConfirmDelete.checked = false;
               deleteAllHistoryItems({
                    pattern: inputPattern.value,
                    url_only: selectFields.value === SELECT_VALUE_URL_ONLY,
                    title_only: selectFields.value == SELECT_VALUE_TITLE_ONLY

               });
          }
     }

     oldOnLoad = window.onload;
     window.onload = function() {
          if (oldOnLoad) {
               oldOnLoad();
          }
          onLoad();
     };
})();
