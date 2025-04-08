import axios from 'axios';
import { join } from 'path'; import fs from 'fs/promises';
import Decimal from 'decimal.js'; 

const PATH = join(global.assetsPath, 'bankOwner.json'); 

const config = {
  name: 'bank',
  aliases: ["bk", "b", "banking"],
  description: 'Bank Online',
  usage: '<Use command to show menu>',
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: 'Dymyrius (Referenced from Waifucat and Ariel Violet)',
  extra: {}
};

const langData = {
  "en_US": {
    "no.account": "【 ℹ 】➜ You don't have an account yet!",
    "have.account": "【 ℹ 】➜ You already have an account!",
    "error": "【 ⚠ 】➜ Error, please try again!",
    "no.name": "【 ⚠ 】➜ Please add your bank name.",
    "success": "【 ℹ 】➜ Successful!",
    "fail": "【 ⚠ 】➜ Failed!",
    "loan.requested": "【 ℹ 】➜ Loan request of {loanAmount} has been submitted for approval.",
    "loan.approved": "【 ℹ 】➜ Loan request for {bankName} has been approved.",
    "loan.denied": "【 ℹ 】➜ Loan request for {bankName} has been denied.",
    "loan.list": "━━【Request Lists】━━\n\n{userList}",
    "no.money": "【 ℹ 】➜ You don't have enough money!",
    "menu": "  【🏦❰𝐂𝐀𝐒𝐈𝐍𝐎 𝐁𝐀𝐍𝐊❱🏦】\n— Experience modern banking with a touch of sophistication. How may I assist you today in managing your account?\n\n𝗬𝗼𝘂𝗿 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:\n1. [register/r <bankName>] - Register a bank account. 🧑‍💼\n2. [withdraw/w <amount>] - Withdraw money. 💸\n3. [deposit/d <amount>] - Deposit money. 💵\n4. [rename <newName>]- Rename account. 🪪\n5. [check] - Info account.💳\n6. [loan <amount>] - Request a loan for a free balance 💰\n7. [top <amount>] - View richest accounts 💎\n━━━━━━━━━━━━━\n𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗼𝗿𝘀 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:\n8. [grant <bankName/sender ID/index>] - Grant a loan request. 💼\n9. [list] - List pending loan requests. 📜\n10. [decline <bankName/index>] - Decline loan request. 🗑\n━━━━━━━━━━━━━\nPlease select the service you require, and I'll be delighted to assist you further. 👨‍💼"
  },
  "vi_VN": {
    "no.account": "【 ℹ 】➜ Bạn chưa có tài khoản!",
    "have.account": "【 ℹ 】➜ Bạn đã có tài khoản!",
    "error": "【 ℹ 】➜ Lỗi, vui lòng thử lại!",
    "success": "【 ℹ 】➜ Thành công!",
    "fail": "【 ℹ 】➜ Thất bại!",
    "no.money": "【 ℹ 】➜ Bạn không đủ tiền!",
    "menu": "【 ℹ 】Hướng Dẫn Sử Dụng 【 ℹ 】n1. Tạo tài khoản: register <tên>\n2. Rút tiền: withdraw <số tiền>\n3. Nạp tiền: deposit <số tiền>\n4. Đổi tên tài khoản: rename <tên mới>\n5. Thông tin tài khoản: check\n6. Xem người giàu nhất: top <số lượng>"
  }
};

async function onCall({ message, args, getLang, userPermissions }) {
  const targetID = message.senderID;
  const { Users } = global.controllers;
  const image = (await axios.get("https://i.imgur.com/a1Y3iHb.png", {
    responseType: "stream"
  })).data;
  const MAX_LOAN_AMOUNT = 5000000; // 5 million units

  if (args.length === 0) {
    message.reply({
      body: getLang("menu"),
      attachment: image
    });
    return;
  }

  let bankData = {};

  try {
    const data = await fs.readFile(PATH, 'utf-8');
    bankData = JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON file:', error);
  }

  if (args[0] === 'register' || args[0] === 'r') {
    const name = args.slice(1).join(' ');

    if (bankData[targetID]) {
      message.reply(getLang("have.account"));
    } else if (!name) {
      message.reply(getLang("no.name"));
    } else {
      bankData[targetID] = { name, coin: 0 };
      try {
        await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
        message.reply(getLang("success"));
      } catch (error) {
        console.error('Error writing to JSON file:', error);
        message.reply(getLang("error"));
      }
    }
  }

  else if (args[0] === 'withdraw' || args[0] === 'w') {
    const coinArg = args[1];

    if (!bankData[targetID]) {
      message.reply(getLang("no.account"));
    } else if (!coinArg) {
      message.reply(getLang("error"));
    } else if (coinArg.toLowerCase() === 'all') {
      const userBalance = bankData[targetID].coin;
      const withdrawAmount = userBalance;

      if (withdrawAmount <= 0) {
        message.reply(getLang("no.money"));
      } else {
        bankData[targetID].coin -= withdrawAmount;
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          await Users.increaseMoney(targetID, withdrawAmount);
          message.reply(getLang("success"));
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      }
    } else {
      const coin = parseFloat(coinArg);

      if (isNaN(coin) || coin <= 0) {
        message.reply(getLang("error"));
      } else if (bankData[targetID].coin < coin) {
        message.reply(getLang("no.money"));
      } else {
        bankData[targetID].coin -= coin;
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          await Users.increaseMoney(targetID, coin);
          message.reply(getLang("success"));
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      }
    }
  }

  else if (args[0] === 'deposit' || args[0] === 'd') {
    const coinArg = args[1];
  
    if (!bankData[targetID]) {
      message.reply(getLang("no.account"));
    } else if (!coinArg) {
      message.reply(getLang("error"));
    } else if (coinArg.toLowerCase() === 'all') {
      const userMoney = await Users.getMoney(targetID);
  
      if (userMoney <= 0) {
        message.reply(getLang("no.money"));
      } else {
        const depositAmount = userMoney;
  
        bankData[targetID].coin += depositAmount;
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          await Users.decreaseMoney(targetID, depositAmount);
          message.reply(getLang("success"));
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      }
    } else if (!/^\d+(\.\d+)?$/.test(coinArg)) {
      message.reply("【 ℹ 】➜ Please enter a valid amount!");
    } else {
      const coin = parseFloat(coinArg);
  
      if (coin <= 0) {
        message.reply("【 ℹ 】➜ Please enter a valid amount!");
      } else {
        const userMoney = await Users.getMoney(targetID);
  
        if (coin > userMoney) {
          message.reply(getLang("no.money"));
        } else {
          bankData[targetID].coin += coin;
          try {
            await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
            await Users.decreaseMoney(targetID, coin);
            message.reply(getLang("success"));
          } catch (error) {
            console.error('Error writing to JSON file:', error);
            message.reply(getLang("error"));
          }
        }
      }
    }
  }

  else if (args[0] === 'rename') {
    const name = args.slice(1).join(' ');

    if (!bankData[targetID]) {
      message.reply(getLang("no.account"));
    } else {
      bankData[targetID].name = name;
      try {
        await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
        message.reply(getLang("success"));
      } catch (error) {
        console.error('Error writing to JSON file:', error);
        message.reply(getLang("error"));
      }
    }
  }

  else if (args[0] === 'check' || args[0] === 'c') {
    if (bankData[targetID]) {
      const { name, coin } = bankData[targetID];
      const balance = new Decimal(coin);
      const formattedBalance = balance.toDecimalPlaces(2).toString();
      message.reply(`━━━【𝗕𝗮𝗻𝗸 𝗔𝗰𝗰𝗼𝘂𝗻𝘁】━━━\n🏦 𝗔𝗰𝗰𝗼𝘂𝗻𝘁 𝗡𝗮𝗺𝗲: ${name}\n💰 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: ₱${formattedBalance}\n━━━━━━ ✕ ━━━━━━━`);
    } else {
      message.reply(getLang("no.account"));
    }
  }

  else if (args[0] === 'top' || args[0] === 't') {
    let limit = 10;
    
    if (args[1] && !isNaN(args[1]) && parseInt(args[1]) > 0) {
      limit = parseInt(args[1]);
      
      if (limit > 1000) {
        limit = 1000;
      }
    }
    
    const userAccounts = Object.entries(bankData).map(([userID, data]) => {
      return {
        userID,
        name: data.name,
        coin: data.coin || 0
      };
    });
    
    userAccounts.sort((a, b) => b.coin - a.coin);
    
    const topAccounts = userAccounts.slice(0, limit);
    
    if (topAccounts.length === 0) {
      message.reply("【 ℹ 】➜ No bank accounts found.");
    } else {
      const topList = topAccounts.map((account, index) => {
        const userName = global.data.users.get(account.userID)?.info?.name || 'Unknown';
        const formattedBalance = new Decimal(account.coin).toDecimalPlaces(2).toString();
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        return `${medal} ${account.name} (${userName})\n⮞ 𝗕𝗮𝗹𝗮𝗻𝗰𝗲: ₱${formattedBalance}`;
      }).join('\n\n');
      
      message.reply(`━━━【💰 𝗧𝗼𝗽 ${limit} 𝗥𝗶𝗰𝗵𝗲𝘀𝘁 𝗕𝗮𝗻𝗸𝘀 💰】━━━\n\n${topList}\n\n━━━━━━ ✕ ━━━━━━━`);
    }
  }

  else if (args[0] === 'loan') {
    const loanAmountArg = args[1];

    if (!bankData[targetID]) {
      message.reply(getLang("no.account"));
    } else if (!loanAmountArg || isNaN(loanAmountArg) || parseFloat(loanAmountArg) <= 0) {
      message.reply(getLang("error"));
    } else {
      const loanAmount = parseFloat(loanAmountArg);

      if (loanAmount > MAX_LOAN_AMOUNT) {
        message.reply(`【 ℹ 】➜ Loan request exceeds the maximum allowed amount of ₱${MAX_LOAN_AMOUNT.toLocaleString()}.`);
      } else {
        bankData[targetID].loanRequest = loanAmount;
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          const formattedLoanAmount = parseFloat(loanAmountArg).toLocaleString(undefined, {
            maximumFractionDigits: 2,
          });
          message.reply(getLang("loan.requested", { loanAmount: `₱${formattedLoanAmount}` }));
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      }
    }
  }

  else if (args[0] === 'grant' && userPermissions.includes(2)) {
    const arg2 = args[1];
  
    if (arg2 && arg2.toLowerCase() === 'all') {
      const grantedUsers = [];
  
      for (const [userID, userData] of Object.entries(bankData)) {
        if (userData.loanRequest > 0) {
          userData.coin += userData.loanRequest;
          userData.loanRequest = 0;
          grantedUsers.push(userID);
        }
      }
  
      if (grantedUsers.length > 0) {
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          message.reply(`【 ℹ 】➜ Loans granted for all users with pending requests.`);
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      } else {
        message.reply(`【 ℹ 】➜ No users have pending loan requests.`);
      }
    } else if (!isNaN(arg2) && arg2 > 0) {
      const index = parseInt(arg2) - 1;
  
      const usersWithLoanRequests = Object.values(bankData).filter((user) => user.loanRequest > 0);
  
      if (index < 0 || index >= usersWithLoanRequests.length) {
        message.reply(`【 ℹ 】➜ Invalid index. Please provide a valid index from the list.`);
      } else {
        const loanUser = usersWithLoanRequests[index];
        const bankName = loanUser.name;
  
        loanUser.coin += loanUser.loanRequest;
        loanUser.loanRequest = 0;
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          message.reply(getLang("loan.approved", { bankName }));
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      }
    } else {
      const bankName = args.slice(1).join(' ');
      const loanUser = Object.values(bankData).find((user) => user.name === bankName && user.loanRequest > 0);
  
      if (!loanUser) {
        message.reply(`【 ℹ 】➜ No loan request from ${bankName}.`);
      } else {
        loanUser.coin += loanUser.loanRequest;
        loanUser.loanRequest = 0;
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          message.reply(getLang("loan.approved", { bankName }));
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      }
    }
  }

  else if (args[0] === 'list' && userPermissions.includes(2)) {
    const usersWithLoanRequests = Object.values(bankData).filter((user) => user.loanRequest > 0);

    if (usersWithLoanRequests.length === 0) {
      message.reply(getLang("loan.list", { userList: "No pending loan requests." }));
    } else {
      const userList = usersWithLoanRequests.map((user, index) => {
        const ownerID = Object.keys(bankData).find((id) => bankData[id] === user);
        const ownerName = global.data.users.get(ownerID)?.info?.name || 'Unknown';
        return `${index + 1}. 𝗡𝗮𝗺𝗲: ${ownerName}\n⮞ 𝗕𝗮𝗻𝗸 𝗔𝗰𝗰𝗼𝘂𝗻𝘁: ${user.name}\n⮞ 𝗟𝗼𝗮𝗻 𝗥𝗲𝗾𝘂𝗲𝘀𝘁: ₱${user.loanRequest.toLocaleString()}\n━━━━━━━━━━━━━\n`;
      }).join('\n');
      message.reply(getLang("loan.list", { userList }));
    }
  }

  else if (args[0] === 'decline' && userPermissions.includes(2)) {
    const arg2 = args[1];
  
    if (arg2 === 'all') {
      const pendingRequestsExist = Object.values(bankData).some((user) => user.loanRequest > 0);
  
      if (pendingRequestsExist) {
        for (const userID in bankData) {
          bankData[userID].loanRequest = 0;
        }
  
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          message.reply(`【 ℹ 】➜ All pending loan requests have been removed.`);
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      } else {
        message.reply(`【 ℹ 】➜ No pending loan requests.`);
      }
    } else if (!isNaN(arg2) && arg2 > 0) {
      const index = parseInt(arg2) - 1;
  
      const usersWithLoanRequests = Object.values(bankData).filter((user) => user.loanRequest > 0);
  
      if (index < 0 || index >= usersWithLoanRequests.length) {
        message.reply(`【 ℹ 】➜ Invalid index. Please provide a valid index from the list.`);
      } else {
        const loanUser = usersWithLoanRequests[index];
        const bankName = loanUser.name;
  
        loanUser.loanRequest = 0;
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          message.reply(`【 ℹ 】➜ Loan request from ${bankName} has been removed.`);
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      }
    } else {
      const bankName = args.slice(1).join(' ');
      const loanUser = Object.values(bankData).find((user) => user.name === bankName && user.loanRequest > 0);
  
      if (!loanUser) {
        message.reply(`【 ℹ 】➜ No pending loan request from ${bankName}.`);
      } else {
        loanUser.loanRequest = 0;
        try {
          await fs.writeFile(PATH, JSON.stringify(bankData, null, 2), 'utf-8');
          message.reply(`【 ℹ 】➜ Loan request from ${bankName} has been removed.`);
        } catch (error) {
          console.error('Error writing to JSON file:', error);
          message.reply(getLang("error"));
        }
      }
    }
  }

  else {
    message.reply(getLang("menu"));
  }
}

export default {
  config,
  langData,
  onCall
}
