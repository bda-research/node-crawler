import got from "got";
import { Agent } from "https";
import { HttpsProxyAgent } from "hpagent";
import constants from "constants";
const options = {
    headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.danawa.com",
        "Referer": "https://www.danawa.com/",
    },
};

got("https://www.danawa.com/", {
    headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.danawa.com",
        "Referer": "https://www.danawa.com/",
    },
    agent: {
        https: new HttpsProxyAgent({
            proxy: "http://hexuenew200:hexuenew200@107.167.89.234:63001",
            secureOptions: constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
        }),
    },
})
    .then(res => {
        console.log(res.body);
    })
    .catch(err => {
        console.log(err);
    });
