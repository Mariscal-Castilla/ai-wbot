import axios from 'axios'
import * as cheerio from 'cheerio'

class Instagram {
    constructor() {
        this.creator = 'Ale'
    }
    
    async create(url) {
        let { data } = await axios.post("https://saveinsta.io/core/ajax.php", {
            url,
            "host": "instagram"
        }, {
            headers: {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "id,en-US;q=0.9,en;q=0.8",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": "https://saveinsta.io",
                "Referer": "https://saveinsta.io/",
                "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Microsoft Edge";v="115", "Chromium";v="115"',
                "Sec-Ch-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188",
                "X-Requested-With": "XMLHttpRequest"
            }
        })
        let $ = cheerio.load(data)
        
        let urls = $("div.row > div.col-md-12 > div").map((a, b) => {
            return $(b).find("a").attr("href") || $(b).find("img").attr("src")
        }).get()
        
        return urls.filter(a => a).map(a => /dl\.php/i.test(a) && "https://saveinsta.io/" + a)
    }
}