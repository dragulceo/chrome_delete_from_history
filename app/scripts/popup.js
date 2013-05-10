/* jshint -W015 */
/* globals Mustache: true */
(function () {
     'use strict';
     var console = chrome.extension.getBackgroundPage().console,
          oldOnLoad, lastDeletedItems, progress, status, SELECT_VALUE_URL_ONLY = 1,
          SELECT_VALUE_TITLE_ONLY = 2,
          PROGRESS_SEARCH_FINISHED = 'finished',
          PROGRESS_SEARCH_STARTED = 'started',
          PROGRESS_SEARCH_RESET = 'reset';

     window.onerror = function () {
          console.error(arguments);
     };

     function $(id) {
          return document.getElementById(id);
     }

     function setUpBodyConsideringLanguage() {
          var n, keys, key, messages = {}, template = $('main').innerHTML,
               keyRegExp = new RegExp('^\\{\\{(.*)\\}\\}$'),
               body = document.querySelector('body');
          body.style.display = 'none';
          keys = template.match(/\{\{([^\}]*)\}\}/g);
          console.log(keys);
          n = keys.length;
          while (n--) {
               key = keys[n].replace(keyRegExp, '$1');
               //console.log(key, key.replace(/^\{\{(.*)\}\}$/, '$1'));
               messages[key] = chrome.i18n.getMessage(key);
          }
          console.log(messages);
          body.innerHTML = Mustache.render(template, messages);
          body.style.display = 'block';
     }

     function filterResults(items, search, callback) {
          var worker;
          worker = new Worker('scripts/filter_worker.js');
          worker.addEventListener('message', function (e) {
               if (e.data.type && e.data.type === 'progress') {
                    updateProgress(e.data.current / e.data.total * 100);
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
          if (typeof typeOrValue === 'string') {
               switch (typeOrValue) {
                    case PROGRESS_SEARCH_FINISHED:
                         value = SEARCH_PERCENT;
                         break;
                    case PROGRESS_SEARCH_STARTED:
                         value = 1;
                         break;
                    case PROGRESS_SEARCH_RESET:
                         value = 0;
                         break;
               }
          } else {
               value = SEARCH_PERCENT + typeOrValue / (100 / SEARCH_PERCENT);
          }
          progress.value = value / 100;
     }

     function onLoad() {
          //button.addEventListener('click', onClickDelete);
          setUpBodyConsideringLanguage();
          $('deleteForm').addEventListener('submit', function (e) {
               e.preventDefault();
               onClickDelete();
               return false;
          });

          progress = $('progress');
          status = $('status');
     }

     function log(str) {
          status.innerHTML = str + '<br>' + status.innerHTML;
     }

     function deleteHistoryItems(items) {
          var n = items.length,
               deleted = n;
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

     function finishDelete() {
          log('Done');
          log('------------------------');
          updateProgress(PROGRESS_SEARCH_RESET);
     }

     function deleteAllHistoryItems(search) {
          var searchCallback, filterCallback;
          log('Looking for pattern: ' + search.pattern);
          filterCallback = function (items) {
               console.log('Items found: ' + items.length);
               deleteHistoryItems(items);
               finishDelete();
          };
          searchCallback = function (items) {
               updateProgress(PROGRESS_SEARCH_FINISHED);
               if (items.length > 0) {
                    console.log('Filtering items (' + items.length + ')');
                    filterResults(items, search, filterCallback);
               } else {
                    finishDelete();
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
		if(confirm(chrome.i18n.getMessage('confirmDelete'))) {
		//	alert('ok');
		}*/
          var selectFields = $('selectFields'),
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
                    urlOnly: selectFields.value === SELECT_VALUE_URL_ONLY,
                    titleOnly: selectFields.value === SELECT_VALUE_TITLE_ONLY

               });
          }
     }

     oldOnLoad = window.onload;
     window.onload = function () {
          if (oldOnLoad) {
               oldOnLoad();
          }
          onLoad();
     };
})();