   const Crawler = require("crawler");

    const base = "https://zenhub.com";
    const crawledPages = { [base]: true };
    const ignoreSelector = `:not([href$=".png"]):not([href$=".jpg"]):not([href$=".mp4"]):not([href$=".mp3"]):not([href$=".gif"])`;
    
    const crawlOptions = {
      skipEventRequest: false,
    };
    
    const callback = (error, res) => {
      if (error) {
        console.error(error);
      } else {
        const $ = res.$;
    
        $(`a[href^="/"]${ignoreSelector},a[href^="${base}"]${ignoreSelector}`).each(
          (_i, elem) => {
            if (!crawledPages[elem.attribs.href]) {
              crawledPages[elem.attribs.href] = true;
              directCrawl(`${base}${elem.attribs.href}`);
            }
          }
        );
      }
    };
    
    const crawler = new Crawler({
      maxConnections: 10,
      rateLimit: 0,
      callback,
    });
    
    const directCrawl = (uri) => {
      crawler.direct({
        uri,
        callback,
        ...crawlOptions,
      });
    };
    
    directCrawl(base);    
