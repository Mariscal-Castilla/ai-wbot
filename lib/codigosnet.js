import fs from 'fs/promises'
import axios from "axios"

export async function codigos(type, email) {
    const data = await axios(`https://codigosnet.org/index.php?tipo=${type}&email=${encodeURIComponent(email)}`, {
        method: "GET",
    })

    console.log(data)
    return data.data
}



export async function loadJSON(filePath) {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

export async function calculate() {
    try {

        const discounts = await loadJSON('./json/discounts.json');
        const services = await loadJSON('./json/services.json');
    
        let results = [];
    
        for (const service of services.services) {
            if (service.available) {
                for (const option of service.options) {
                    if (option.available) {
                        discounts.forEach(discount => {
                          const accounts = discount.accounts;
                          const discountPercentage = discount.discount;
                          
                          const totalPrice = option.price * accounts;
                          
                          const discountAmount = totalPrice * (discountPercentage / 100);
                          const discountedPrice = totalPrice - discountAmount;
                          
                          const profit = totalPrice - discountedPrice;
                          
                          results.push({
                              service: service.name,
                              option: option.type,
                              accounts: accounts,
                              price: totalPrice,
                              discounted: discountedPrice,
                              percentage: discountPercentage,
                              profit: profit
                          })
                        })
                    }
                }
            }
        }
        return JSON.stringify(results, null, 2)

    } catch (error) {
        console.error('Error processing data:', error)
    }
}