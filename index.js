


require('dotenv').config()



const financial = require('./model/financial')
const moment = require('jalali-moment');



const msgApp = require("message.io-client")({
  pass: process.env.MSG_PASS,
});

const Query = msgApp.Query
const Emit = msgApp.Emit

Query({
  scope: 'financial',
  address: 'user/wallet/data',
  method: 'GET'
}, async data => {


  try {
    const findedBalance = await financial.balance.findOne({
      uid: data.sender,
    })


    Emit("data_gram", {
      uid: data.sender,
      scope: 'wallet',
      address: 'wallet/home',
      type: 'object',
      data: {
        mode: 'init',
        data: {
          value: findedBalance.value
        }
      }
    })
  } catch (error) {

  }


})


Query({
  scope: 'financial',
  address: 'user/wallet/transactions',
  method: 'GET'
}, async data => {

  // const perPage = 10

  try {
    const findedTransactions = await financial.TransActions.find({
      uid: data.sender,
    })
      .sort({
        date: 1
      })
    /* .skip(perPage * data.data.page )
    .limit(perPage)
    .sort({
      date : -1
    })
    */


    console.log(findedTransactions)
    Emit("data_gram", {
      uid: data.sender,
      scope: 'wallet',
      address: 'wallet/transactions',
      type: 'object',
      data: {
        mode: 'init',
        data: {
          transactions: findedTransactions
        }
      }
    })
  } catch (error) {

  }


})


Query({
  scope: 'financial',
  address: 'user/wallet/transfer',
  method: 'DO'
}, async data => {


  if (data.sender == data.data.national) {
    Emit("gram_message", {
      uid: data.sender,
      message: "انتقال وجه از خودتان به خودتان ممکن نیست"
    })
    return
  }

  if (data.data.cost <= 0) {
    Emit("gram_message", {
      uid: data.sender,
      message: "مبلغ باید بزرگتر از صفر باشد"
    })
    return
  }

  if (isNaN(data.data.cost)) {
    Emit("gram_message", {
      uid: data.sender,
      message: "داده ی عددی وارد کنید"
    })
    return
  }



  let user = await financial.balance.findOne({ uid: data.data.national })

  if (!user) {
    Emit("gram_message", {
      uid: data.sender,
      message: "این کاربر در حال حاضر حساب مالی ندارد"
    })
    return
  }

  financial.balance.findOne({
    uid: data.sender,
  }).then((d) => {
    if (d.value >= data.data.cost) {
      return true
    } else {
      return false
    }
  })
    .then((ok) => {
      if (ok) {
        financial.TransActions.create({
          date: moment().format('jYYYY-jMM-jDDTHH:mm:ssZ .'),
          amount: data.data.cost,
          description: " انتقال وجه به" + data.data.national,
          issuer: "wallet-microservice-transfer",
          type: "DOWN",
          uid: data.sender,
          tag: "tr"
        }).then(console.log).catch(console.error)
        financial.TransActions.create({
          date: moment().format('jYYYY-jMM-jDDTHH:mm:ssZ .'),
          amount: data.data.cost,
          description: " انتقال وجه از " + data.sender,
          issuer: "wallet-microservice-transfer",
          type: "UP",
          uid: data.data.national,
          tag: "tr"
        }).then(console.log).catch(console.error)



        financial.balance.update({
          uid: data.data.national,
        }, {
            "$inc": {
              value: data.data.cost
            }
          }).exec()
        financial.balance.update({
          uid: data.sender,
        }, {
            "$inc": {
              value: (data.data.cost * -1)
            }
          }).exec();
        Emit("data_gram", {
          uid: data.sender,
          scope: 'reserveSystem',
          address: 'Foodlist/balancing',
          type: 'object',
          data: {
            mode: 'load',
            data: {
              cost: data.data.cost,
              add: false
            }
          }
        })
        Emit("data_gram", {
          uid: data.data.national,
          scope: 'reserveSystem',
          address: 'Foodlist/balancing',
          type: 'object',
          data: {
            mode: 'load',
            data: {
              cost: data.data.cost,
              add: true
            }
          }
        })
        Emit("gram_message", {
          uid: data.data.national,
          message: `${data.sender} مبلغ ${data.data.cost} ریال به شما انتقال داد`
        })
        Emit("gram_message", {
          uid: data.sender,
          message: "یک انتقال اعتبار موفق از سمت شما انجام شد"
        })

      } else {
        Emit("gram_message", {
          uid: data.sender,
          message: "اختلال در انتقال اعتبار e789"
        })

      }
    })

  Emit("transfer", data)
})