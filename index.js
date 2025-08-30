
// require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
// 7447083879
// xvcv
// const bot = new Telegraf('bot_token');
const bot = new Telegraf(process.env.BOT_TOKEN);
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
// JSONdagi provayderlar
const providers = JSON.parse(fs.readFileSync('./providers.json', 'utf-8'));

const services = {
    'Evakuator': 'evacuator',
    'Vulkanizatsiya': 'vulkanizatsiya',
    'Akumulyator': 'akumulyator'
};

let selectedService = null;

// let admin_id = 7447083879;

// let users = {};

// if (fs.existsSync("users.json")) {
//     try {
//         users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
//     } catch (err) {
//         console.log("users.json bo‘sh yoki noto‘g‘ri formatda, yangi obyekt yaratiladi.");
//         users = {};
//     }
// }


// bot.command("stat", (ctx) => {
//     if (ctx.from.id !== admin_id) return ctx.reply("❌ Sizda bunday huquq yo'q!");

//     // users obyektidagi kalitlar soni = foydalanuvchilar soni
//     const count = Object.keys(users).length;

//     let text = `📊 Bot foydalanuvchilari soni: ${count} ta\n\n`;

//     for (let uid in users) {
//         const u = users[uid];
//         const username = u.username ? `@${u.username}` : "❌ username yo'q";
//         text += `• ${u.first_name} ${u.last_name || ""} (${username}) [ID: ${u.id}]\n`;
//     }

//     ctx.reply(text);
// });



bot.start(ctx => {
    // const user = ctx.from;
    // if (!users[user.id]) {
    //     users[user.id] = {
    //         id: user.id,
    //         username: user.username || null,
    //         first_name: user.first_name || "",
    //         last_name: user.last_name || "",
    //     };

    //     // Faylga yozish
    //     fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
    // }
    ctx.reply(`Assalomu aleykum ${ctx.from.first_name}! Qaysi xizmat kerak?`, {
        reply_markup: {
            keyboard: [['Evakuator', 'Vulkanizatsiya'], ['Akumulyator']],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});


bot.on('text', ctx => {
    const message = ctx.message.text;

    // Agar "Bosh menyuga qaytish" bosilgan bo'lsa
    if (message === 'Bosh menyuga qaytish') {
        selectedService = null;
        return ctx.reply(`Assalomu aleykum ${ctx.from.first_name}! Qaysi xizmat kerak?`, {
            reply_markup: {
                keyboard: [['Evakuator', 'Vulkanizatsiya'], ['Akumulyator']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    const serviceType = services[message];
    if (!serviceType) {
        return ctx.reply('Iltimos, xizmat turini tanlang!');
    }

    selectedService = serviceType;

    ctx.reply('Iltimos, joylashuvingizni yuboring 📍', {
        reply_markup: {
            keyboard: [[{ text: 'Joylashuvni yuborish', request_location: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});


// ==========================================


bot.on('location', async ctx => {
    if (!selectedService) return ctx.reply('Avval xizmat turini tanlang!');

    const { latitude, longitude } = ctx.message.location;

    // Faqat tanlangan xizmatdagilarni olish
    const filtered = providers.filter(p => p.serviceType === selectedService);
    if (filtered.length === 0) {
        return ctx.reply('Bu xizmat bo‘yicha provayder topilmadi.', {
            reply_markup: {
                keyboard: [['Bosh menyuga qaytish']],
                resize_keyboard: true
            }
        });
    }

    // Masofaga qarab saralash
    filtered.sort((a, b) => {
        const distA = getDistance(latitude, longitude, a.location.lat, a.location.lng);
        const distB = getDistance(latitude, longitude, b.location.lat, b.location.lng);
        return distA - distB;
    });

    // Eng yaqin 3 ta provayder
    for (const p of filtered.slice(0, 3)) {
        const dist = getDistance(latitude, longitude, p.location.lat, p.location.lng).toFixed(1);

        // Lokatsiya yuborish
        const locationMsg = await ctx.replyWithLocation(p.location.lat, p.location.lng);

        // Ma'lumot yuborish (reply sifatida)
        await ctx.reply(
            `🚗 ${p.name}\nMasofa: ${dist} km\n☎️ Kontakt: ${p.contact}`,
            { reply_to_message_id: locationMsg.message_id }
        );
    }

    // ✅ Lokatsiyadan keyin bosh menyuga qaytish keyboardini ko'rsatish
    await ctx.reply('🔙 Bosh menyuga qaytish uchun tugmani bosing', {
        reply_markup: {
            keyboard: [['Bosh menyuga qaytish']],
            resize_keyboard: true
        }
    });
});


// Masofa hisoblash (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

bot.launch();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
console.log('🚀 Bot ishga tushdi');
