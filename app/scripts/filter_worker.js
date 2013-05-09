(function() {


     function run(items, search) {
          var n = items.length,
               matcher = new RegExp(search.pattern, "i"),
               url_only = search.url_only || false,
               title_only = search.title_only || false,
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
               if ((!title_only && item.url.match(matcher)) || (!url_only && item.title.match(matcher))) {
                    filtered.push(item);
               }
          }
          return filtered;
     }


     this.addEventListener('message', function(e) {
          return postMessage(run(e.data.items, e.data.search));
     });

}).call(this);
