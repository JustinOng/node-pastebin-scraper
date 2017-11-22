const request = require("request");
const throttled_request = require("throttled-request")(request);
const cheerio = require("cheerio");
const EventEmitter = require('events');

const utils = require('./utils.js');

throttled_request.configure({
  requests: 1,
  milliseconds: 3000
});

class Pastebin extends EventEmitter {
  // cb(err, paste_text)
  load_paste(id, cb) {
    throttled_request("https://pastebin.com/raw/{0}".format(id), function(err, full_response, body) {
      if (err) {
        if (cb) cb(err);
        return;
      }

      cb(false, body);
    });
  }

  // cb(err, [ids])
  list_latest_pastes(cb) {
    request("http://pastebin.com/archive", function(err, full_response, body) {
      if (err) {
        if (cb) cb(err);
        return;
      }

      const $ = cheerio.load(body);
      const trs = $(".maintable").find("tr");

      let found = [];

      // first row is table header, not useful
      for(let i = 1; i < trs.length; i++) {
        const tr = trs.eq(i);
        let id = tr.find("a").attr("href").replace(/\//g, "");
        found.push(id);
      }

      if (cb) cb(false, found);
    });
  }

  update() {
    const self = this;

    if (self.waiting_ids.length > 0) {
      console.warn("Update called with {0} pastes still waiting to be loaded!".format(self.waiting_ids.length));
    }

    let new_ids = 0;

    self.list_latest_pastes(function(err, ids) {
      if (err) return console.error(err);

      for(let id of ids) {
        if (self.loaded_ids.indexOf(id) > -1 || self.waiting_ids.indexOf(id) > -1) {
          //console.log("Skipping", id);
          continue;
        }

        new_ids ++;

        self.load_paste(id, function(err, paste) {
          if (err) return console.error(err);

          self.waiting_ids.splice(self.waiting_ids.indexOf(id), 1);
          self.loaded_ids.push(id);

          self.emit("new_paste", id, paste);
        });

        self.waiting_ids.push(id);
      }

      console.log("Found {0} new pastes".format(new_ids));

      // prune loaded_ids so that it dosent get longer and longer as time passes
      // deletes ids that are no longer found in the current update ie
      // id has moved off the page
      self.loaded_ids.filter(function(id) {
        return ids.indexOf(id) > -1;
      });
    });
  }

  constructor() {
    super();

    const self = this;

    this.loaded_ids = [];
    this.waiting_ids = [];

    self.update();

    setInterval(function() {
      self.update();
    }, 60*1000);
  }
}

module.exports = new Pastebin();
