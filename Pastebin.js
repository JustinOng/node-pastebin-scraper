const request = require("throttled-request")(require("request"));
const cheerio = require("cheerio");

request.configure({
  requests: 1,
  milliseconds: 3000
});

class Pastebin {
  // cb(err, [ids])
  load_latest_list(cb) {
    request("http://pastebin.com/archive", function(err, full_response, body){
      if (err) {
        if (cb) return cb(err);
      }

      const $ = cheerio.load(body);
      const trs = $(".maintable").find("tr");

      let found = [];

      for(let i = 1; i < trs.length; i++) {
        const tr = trs.eq(i);
        let id = tr.find("a").attr("href").replace(/\//g, "");
        found.push(id);
      }

      if (cb) cb(false, found);
    });
  }

  constructor() {
    this.load_latest_list(function(err, ids) {
      if (err) return console.error(err);

      console.log(ids);
    });
  }
}

module.exports = new Pastebin();
