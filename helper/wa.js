require('dotenv').config();
const axios = require('axios');
const WA_API_BASE_URL = process.env.WA_API_BASE_URL;
const WA_API_KEY = process.env.WA_API_KEY;
console.log(WA_API_KEY);
async function getChat(chatId) {
    let data = JSON.stringify({
        "id_chat": chatId,
        "limit": 5
    });
    

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: WA_API_BASE_URL +'/api/wa/getChat',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WA_API_KEY}`
        },
        data: data
    };
    let response = await axios(config);
    response = response.data;
    let chats = [];
    for (let x of response.data.oldMessages){
        if (x.type == "chat"){
            let pesan = {
                "message": x.body,
                "from": x.from,
                "to": x.to,
                "deviceType": x.deviceType,
                "type": x.type,
                "timestamp": x.timestamp,
                "time": new Date(x.timestamp * 1000).toString()
            }
            chats.push(pesan);
        }
       
    }
    
    console.log(chats);
    return chats

}

async function getlistChat() {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: WA_API_BASE_URL + '/api/wa/listChat',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WA_API_KEY}`
        }
    };
    let response = await axios(config);
    response = response.data;
    console.log(JSON.stringify(response, null, 2));
    return response.data
}
// getlistChat();
// getChat('275659708469392@lid');
module.exports = {
    getChat,
    getlistChat
}