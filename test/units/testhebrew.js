/**
 * Created by ozlevka on 8/30/14.
 */



var cral = require('../../lib/crawler');

var crawler = new cral.Crawler();


crawler.queue([{
    uri: 'http://www.kan-naim.co.il/artical.asp?id=17339&cid=692',
    incomingEncoding : 'windows-1255',
    forceUTF8 : true,
    callback : function(error,result,$) {
        console.log(result.body);
        process.exit(0);
    }
}]);