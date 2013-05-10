/* jshint -W015 */
/* global postMessage: true, addEventListener: true */
(function () {
     'use strict';
     var run = function run(items, search) {
          var n = items.length,
               item,
               matcher = new RegExp(search.pattern, 'i'),
               urlOnly = search.urlOnly || false,
               titleOnly = search.titleOnly || false,
               filtered = [],
               total = n,
               step = Math.floor(n / 20);
          while (n--) {
               if (n % step === 0) {
                    postMessage({
                         type: 'progress',
                         total: total,
                         current: total - n
                    });
               }
               item = items[n];
               if ((!titleOnly && item.url.match(matcher)) || (!urlOnly && item.title.match(matcher))) {
                    filtered.push(item);
               }
          }
          return filtered;
     };


     addEventListener('message', function (e) {
          return postMessage(run(e.data.items, e.data.search));
     });
})();