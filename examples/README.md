# Node Crawler Examples

Node Crawler is a great open source web scraping tool. However, there are a few common questions regarding how to use it. Let's hash it out: 

## Table of Content
  - [Use a proxy with Crawler](#use-proxy-with-crawler)
  - [Download images and other files](#download-images-and-other-files)
  - [Get full path using jQuery Selector](#get-full-path-using-jquery-selector)

### Use Proxy with Crawler 
Most large scale webscraping tasks requires us to perform countless amounts of access to a specific website. This could be very risky using only one IP address since the website could permanently or temporarily block our IP address. Instead, we can use a proxy that gives us the freedom to access websites using multiple different IPs. **Below is an example of how to use a proxy with Crawler:** 
```javascript
const Crawler = require("crawler");

// for global
new Crawler({
    rateLimit:1000,
    proxy: "http://proxy.example.com"
});

//for just one task
Crawler.queue({
    uri: "http://www.example.com",
    proxy: "http://proxy.example.com"
})
```


### Download Images and Other Files
Some of our web scraping tasks involves downloading images or other file types, like grabbing images to train image recognition algorithms. 
With crawler, a few settings will do the trick; simply set ```encoding``` and ```jQuery``` options to ```null``` and ```false``` respectively when queuing a task.  **Below is an example of downloading images with Crawler:**
```javascript
const Crawler = require("crawler");
const fs = require("fs");

let crawler = new Crawler({
    maxConnections : 10,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            fs.createWriteStream(res.options.filename).write(res.body);
        }
        done();
    }
});

crawler.queue({
   uri: 'http://www.example.com/image.jpg',
   filename: 'myImage.jpg',
   encoding: null,
   jQuery: false
});
```


### Get Full Path Using jQuery Selector
Visiting different layers within a website requires us to follow embedded links/paths. However, most embedded links can only give us partial links/paths. To obtain the full path, simply use ```URL.resolve(requestUrl, href)``` to concatenate the full path. **Here is an example:**

Say that you want to visit
`http://www.google.com/search `
and it returns :
`<a href="/article/174143.html" class="transition" target="_blank">hello world</a>`
The following code will concatenate the partial url into a full path: 
```javascript
const URL = require('url')

let requestUrl = res.request.uri.href;
let href = $('a.transition').attr('href')

# This gives you 'http://www.google.com/article/174143.html'
console.log(URL.resolve(requestUrl, href))
```




