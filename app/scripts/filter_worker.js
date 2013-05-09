(function() {


     function run(items, pattern) {
          //var chromeApi = this.chrome, textFilter = this.text;
          var n = items.length,
               matcher = new RegExp(pattern, "i"),
               filtered = [];
          while (n--) {
               item = this.items[n];
               if (item.url.match(matcher) || item.title.match(matcher)) {
                    filtered.push(item);
               }
          }
		  return filtered;
     }


     self.addEventListener('message', function(e) {
          return postMessage(run(e.data.items, e.data.pattern));
     });

}).call(this);
